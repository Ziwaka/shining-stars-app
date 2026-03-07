"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

const S = {
  page:   { minHeight:'100vh', background:'#0f0a1e', color:'#fff', fontFamily:'system-ui,sans-serif', paddingBottom:'80px' },
  header: { position:'sticky', top:0, zIndex:40, background:'rgba(15,10,30,0.97)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,0.07)', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' },
  card:   { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'16px', padding:'16px' },
  label:  { fontSize:'9px', color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.12em', fontWeight:900 },
  tabOn:  { background:'#fbbf24', color:'#0f172a', border:'none', borderRadius:'10px', padding:'7px 14px', fontSize:'10px', fontWeight:900, textTransform:'uppercase', cursor:'pointer', whiteSpace:'nowrap' },
  tabOff: { background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.4)', border:'none', borderRadius:'10px', padding:'7px 14px', fontSize:'10px', fontWeight:900, textTransform:'uppercase', cursor:'pointer', whiteSpace:'nowrap' },
};

const HOUSE_COLORS = {
  'အနော်ရထာ': '#ef4444', 'ဗညားဒလ': '#3b82f6',
  'မင်းဒေါင်းဆိပ်': '#22c55e', 'စစ်ကိုင်းမင်': '#a855f7',
};
const houseColor = (h) => HOUSE_COLORS[h] || '#fbbf24';

const StatCard = ({ icon, label, value, color='#fbbf24', sub }) => (
  <div style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', padding:'14px', display:'flex', flexDirection:'column', gap:'4px' }}>
    <div style={{ fontSize:'20px' }}>{icon}</div>
    <div style={{ fontSize:'22px', fontWeight:900, color }}>{value}</div>
    <div style={{ fontSize:'9px', color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{label}</div>
    {sub && <div style={{ fontSize:'9px', color:'rgba(255,255,255,0.2)', marginTop:'2px' }}>{sub}</div>}
  </div>
);

const Bar = ({ label, value, max, color }) => {
  const pct = max > 0 ? Math.min(100, Math.round((value/max)*100)) : 0;
  return (
    <div style={{ marginBottom:'10px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', marginBottom:'4px' }}>
        <span style={{ color:'rgba(255,255,255,0.6)' }}>{label}</span>
        <span style={{ fontWeight:900, color }}>{value}</span>
      </div>
      <div style={{ height:'5px', background:'rgba(255,255,255,0.06)', borderRadius:'99px', overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:'99px', transition:'width 0.8s ease' }}/>
      </div>
    </div>
  );
};

export default function AnalyticsPage() {
  const router = useRouter();
  const [tab, setTab]       = useState('overview');
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

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
      const r = await res.json();
      if (r.success) { setData(r); setLastUpdated(new Date().toLocaleTimeString()); }
    } catch {}
    setLoading(false);
  };

  const TABS = [
    { id:'overview',  label:'📊 Overview' },
    { id:'students',  label:'🎓 Students' },
    { id:'academic',  label:'📝 Academic' },
    { id:'finance',   label:'💰 Finance' },
    { id:'operations',label:'⚙️ Ops' },
  ];

  return (
    <div style={S.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}`}</style>

      <div style={S.header}>
        <button onClick={()=>router.back()} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:'14px'}}>← Back</button>
        <div style={{textAlign:'center'}}>
          <p style={{fontWeight:900,fontSize:'13px',textTransform:'uppercase',letterSpacing:'0.1em',margin:0}}>Analytics</p>
          {lastUpdated && <p style={{fontSize:'8px',color:'rgba(255,255,255,0.2)',margin:0}}>Updated {lastUpdated}</p>}
        </div>
        <button onClick={fetchData} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:'18px'}}>↻</button>
      </div>

      <div style={{display:'flex',gap:'6px',padding:'12px 16px 8px',overflowX:'auto'}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={tab===t.id?S.tabOn:S.tabOff}>{t.label}</button>
        ))}
      </div>

      <div style={{padding:'0 16px'}}>
        {loading ? (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'80px 0',gap:'16px'}}>
            <div style={{width:'36px',height:'36px',border:'3px solid rgba(255,255,255,0.1)',borderTop:'3px solid #fbbf24',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
            <p style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:'0.1em'}}>Compiling data...</p>
          </div>
        ) : !data ? (
          <div style={{textAlign:'center',padding:'80px 0',color:'rgba(255,255,255,0.2)'}}>Data မရရှိနိုင်ပါ</div>
        ) : (
          <>
            {/* ══ OVERVIEW ══ */}
            {tab==='overview' && (
              <div style={{display:'flex',flexDirection:'column',gap:'12px',marginTop:'8px'}}>
                {/* Top KPIs */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                  <StatCard icon="🎓" label="Students" value={data.students.total} color='#60a5fa' sub={`${data.students.active} active`}/>
                  <StatCard icon="👔" label="Staff" value={data.staff.total} color='#c084fc' sub={`${data.staff.active} active`}/>
                  <StatCard icon="💰" label="Revenue" value={(data.fees.revenue||0).toLocaleString()+' ks'} color='#34d399' sub={`${data.fees.paid} paid`}/>
                  <StatCard icon="📋" label="Leave (Pending)" value={data.leaves.pending} color={data.leaves.pending>0?'#fbbf24':'#34d399'} sub={`${data.leaves.approved} approved`}/>
                </div>

                {/* Score snapshot */}
                {data.scores.total > 0 && (
                  <div style={S.card}>
                    <p style={{...S.label,marginBottom:'12px'}}>Academic Snapshot</p>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px',textAlign:'center'}}>
                      {[
                        {label:'Avg Score', value:data.scores.avg+'%', color:'#fbbf24'},
                        {label:'Distinctions', value:data.scores.distinctions, color:'#34d399'},
                        {label:'Records', value:data.scores.total, color:'#60a5fa'},
                      ].map((s,i)=>(
                        <div key={i}>
                          <div style={{fontSize:'20px',fontWeight:900,color:s.color}}>{s.value}</div>
                          <div style={{fontSize:'8px',color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:'0.1em',marginTop:'2px'}}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* House leaderboard mini */}
                {data.housePoints.length > 0 && (
                  <div style={S.card}>
                    <p style={{...S.label,marginBottom:'12px'}}>🏆 House Leaderboard</p>
                    {data.housePoints.map((h,i)=>(
                      <Bar key={i} label={`${['🥇','🥈','🥉','4️⃣'][i]||'⭐'} ${h.house}`}
                        value={h.total} max={data.housePoints[0]?.total||1}
                        color={houseColor(h.house)}/>
                    ))}
                  </div>
                )}

                {/* Gender donut simple */}
                <div style={S.card}>
                  <p style={{...S.label,marginBottom:'12px'}}>Gender Breakdown</p>
                  <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
                    <div style={{flex:1}}>
                      <Bar label={`♂ Male`} value={data.students.male} max={data.students.total} color='#60a5fa'/>
                      <Bar label={`♀ Female`} value={data.students.female} max={data.students.total} color='#f472b6'/>
                    </div>
                    <div style={{flexShrink:0,textAlign:'center'}}>
                      <div style={{fontSize:'11px',color:'rgba(255,255,255,0.3)'}}>M/F Ratio</div>
                      <div style={{fontWeight:900,fontSize:'16px',color:'#fbbf24'}}>
                        {data.students.male}:{data.students.female}
                      </div>
                    </div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginTop:'10px'}}>
                    <div style={{background:'rgba(255,255,255,0.03)',borderRadius:'10px',padding:'8px 12px',textAlign:'center'}}>
                      <div style={{fontWeight:900,color:'#60a5fa',fontSize:'16px'}}>{data.students.school}</div>
                      <div style={{fontSize:'8px',color:'rgba(255,255,255,0.25)',textTransform:'uppercase',letterSpacing:'0.1em'}}>Day School</div>
                    </div>
                    <div style={{background:'rgba(255,255,255,0.03)',borderRadius:'10px',padding:'8px 12px',textAlign:'center'}}>
                      <div style={{fontWeight:900,color:'#c084fc',fontSize:'16px'}}>{data.students.hostel}</div>
                      <div style={{fontSize:'8px',color:'rgba(255,255,255,0.25)',textTransform:'uppercase',letterSpacing:'0.1em'}}>Hostel</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══ STUDENTS ══ */}
            {tab==='students' && (
              <div style={{display:'flex',flexDirection:'column',gap:'12px',marginTop:'8px'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
                  <StatCard icon="👥" label="Total" value={data.students.total} color='#60a5fa'/>
                  <StatCard icon="♂" label="Male" value={data.students.male} color='#38bdf8'/>
                  <StatCard icon="♀" label="Female" value={data.students.female} color='#f472b6'/>
                </div>

                {/* Grade breakdown */}
                <div style={S.card}>
                  <p style={{...S.label,marginBottom:'12px'}}>Grade Distribution</p>
                  {data.students.gradeBreakdown.map((g,i)=>(
                    <Bar key={i} label={g.grade} value={g.count}
                      max={Math.max(...data.students.gradeBreakdown.map(x=>x.count))}
                      color='#60a5fa'/>
                  ))}
                </div>

                {/* House distribution */}
                {Object.keys(data.students.houseCounts||{}).length > 0 && (
                  <div style={S.card}>
                    <p style={{...S.label,marginBottom:'12px'}}>House Distribution</p>
                    {Object.entries(data.students.houseCounts).map(([h,c],i)=>(
                      <Bar key={i} label={h} value={c}
                        max={Math.max(...Object.values(data.students.houseCounts))}
                        color={houseColor(h)}/>
                    ))}
                  </div>
                )}

                {/* Boarding */}
                <div style={S.card}>
                  <p style={{...S.label,marginBottom:'12px'}}>School vs Hostel</p>
                  <Bar label="Day School" value={data.students.school} max={data.students.total} color='#60a5fa'/>
                  <Bar label="Hostel" value={data.students.hostel} max={data.students.total} color='#c084fc'/>
                </div>
              </div>
            )}

            {/* ══ ACADEMIC ══ */}
            {tab==='academic' && (
              <div style={{display:'flex',flexDirection:'column',gap:'12px',marginTop:'8px'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                  <StatCard icon="📊" label="Avg Score" value={data.scores.avg+'%'} color='#fbbf24'/>
                  <StatCard icon="⭐" label="Distinctions" value={data.scores.distinctions} color='#34d399'/>
                  <StatCard icon="❌" label="Fails" value={data.scores.fails} color='#f87171'/>
                  <StatCard icon="📋" label="Records" value={data.scores.total} color='#60a5fa'/>
                </div>

                {data.scores.subjectAvg.length > 0 && (
                  <div style={S.card}>
                    <p style={{...S.label,marginBottom:'12px'}}>Top Subjects by Average</p>
                    {data.scores.subjectAvg.map((s,i)=>(
                      <div key={i} style={{marginBottom:'10px'}}>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:'11px',marginBottom:'4px'}}>
                          <span style={{color:'rgba(255,255,255,0.6)'}}>{s.subject}</span>
                          <span style={{fontWeight:900,color:s.avg>=80?'#34d399':s.avg>=60?'#60a5fa':s.avg>=40?'#fbbf24':'#f87171'}}>{s.avg}%</span>
                        </div>
                        <div style={{height:'5px',background:'rgba(255,255,255,0.06)',borderRadius:'99px',overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${s.avg}%`,borderRadius:'99px',
                            background:s.avg>=80?'#34d399':s.avg>=60?'#60a5fa':s.avg>=40?'#fbbf24':'#f87171'}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {data.housePoints.length > 0 && (
                  <div style={S.card}>
                    <p style={{...S.label,marginBottom:'12px'}}>🏆 House Points</p>
                    {data.housePoints.map((h,i)=>{
                      const col = houseColor(h.house);
                      return (
                        <div key={i} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 0',borderBottom:i<data.housePoints.length-1?'1px solid rgba(255,255,255,0.05)':'none'}}>
                          <span style={{fontSize:'20px'}}>{['🥇','🥈','🥉','4️⃣'][i]||'⭐'}</span>
                          <div style={{flex:1}}>
                            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
                              <span style={{fontWeight:900,fontSize:'12px',color:col}}>{h.house}</span>
                              <span style={{fontWeight:900,fontSize:'14px',color:col}}>{h.total} pts</span>
                            </div>
                            <div style={{height:'4px',background:'rgba(255,255,255,0.06)',borderRadius:'99px',overflow:'hidden'}}>
                              <div style={{height:'100%',width:`${Math.round((h.total/(data.housePoints[0]?.total||1))*100)}%`,background:col,borderRadius:'99px'}}/>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {data.scores.total === 0 && (
                  <div style={{textAlign:'center',padding:'50px 0',color:'rgba(255,255,255,0.2)'}}>Score records မရှိသေးပါ</div>
                )}
              </div>
            )}

            {/* ══ FINANCE ══ */}
            {tab==='finance' && (
              <div style={{display:'flex',flexDirection:'column',gap:'12px',marginTop:'8px'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                  <StatCard icon="💰" label="Total Revenue" value={(data.fees.revenue||0).toLocaleString()+' ks'} color='#34d399'/>
                  <StatCard icon="✅" label="Paid Records" value={data.fees.paid} color='#34d399'/>
                  <StatCard icon="⏳" label="Pending" value={data.fees.pending} color='#fbbf24'/>
                </div>
                {data.fees.paid === 0 && data.fees.pending === 0 && (
                  <div style={{textAlign:'center',padding:'50px 0',color:'rgba(255,255,255,0.2)'}}>Fee records မရှိသေးပါ</div>
                )}
              </div>
            )}

            {/* ══ OPERATIONS ══ */}
            {tab==='operations' && (
              <div style={{display:'flex',flexDirection:'column',gap:'12px',marginTop:'8px'}}>
                {/* Leave stats */}
                <div style={S.card}>
                  <p style={{...S.label,marginBottom:'12px'}}>Leave Management</p>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',textAlign:'center',marginBottom:'12px'}}>
                    {[
                      {label:'Pending', value:data.leaves.pending, color:'#fbbf24'},
                      {label:'Approved', value:data.leaves.approved, color:'#34d399'},
                      {label:'Rejected', value:data.leaves.rejected, color:'#f87171'},
                    ].map((s,i)=>(
                      <div key={i} style={{background:'rgba(255,255,255,0.03)',borderRadius:'10px',padding:'10px'}}>
                        <div style={{fontSize:'20px',fontWeight:900,color:s.color}}>{s.value}</div>
                        <div style={{fontSize:'8px',color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:'0.08em',marginTop:'2px'}}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {data.leaves.recent.length > 0 && (
                    <>
                      <p style={{...S.label,marginBottom:'8px'}}>Recent Leaves</p>
                      {data.leaves.recent.map((l,i)=>(
                        <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 0',borderBottom:i<data.leaves.recent.length-1?'1px solid rgba(255,255,255,0.05)':'none'}}>
                          <div>
                            <span style={{fontSize:'12px',color:'rgba(255,255,255,0.7)'}}>{l.Name}</span>
                            <span style={{fontSize:'9px',color:'rgba(255,255,255,0.3)',marginLeft:'8px'}}>{l.Leave_Type}</span>
                          </div>
                          <span style={{fontSize:'9px',fontWeight:900,padding:'2px 10px',borderRadius:'99px',
                            background:l.Status==='Approved'?'rgba(52,211,153,0.15)':l.Status==='Rejected'?'rgba(248,113,113,0.15)':'rgba(251,191,36,0.15)',
                            color:l.Status==='Approved'?'#34d399':l.Status==='Rejected'?'#f87171':'#fbbf24'}}>
                            {l.Status}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {/* Staff overview */}
                <div style={S.card}>
                  <p style={{...S.label,marginBottom:'12px'}}>Staff Overview</p>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',textAlign:'center'}}>
                    <div style={{background:'rgba(255,255,255,0.03)',borderRadius:'10px',padding:'12px'}}>
                      <div style={{fontSize:'22px',fontWeight:900,color:'#c084fc'}}>{data.staff.total}</div>
                      <div style={{fontSize:'8px',color:'rgba(255,255,255,0.3)',textTransform:'uppercase',marginTop:'2px'}}>Total Staff</div>
                    </div>
                    <div style={{background:'rgba(255,255,255,0.03)',borderRadius:'10px',padding:'12px'}}>
                      <div style={{fontSize:'22px',fontWeight:900,color:'#34d399'}}>{data.staff.active}</div>
                      <div style={{fontSize:'8px',color:'rgba(255,255,255,0.3)',textTransform:'uppercase',marginTop:'2px'}}>Active</div>
                    </div>
                  </div>
                </div>

                {/* Recent notes */}
                {data.recentNotes.length > 0 && (
                  <div style={S.card}>
                    <p style={{...S.label,marginBottom:'12px'}}>Recent Student Notes</p>
                    {data.recentNotes.map((n,i)=>(
                      <div key={i} style={{padding:'7px 0',borderBottom:i<data.recentNotes.length-1?'1px solid rgba(255,255,255,0.05)':'none'}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'2px'}}>
                          <span style={{fontSize:'12px',fontWeight:700,color:'rgba(255,255,255,0.7)'}}>{n.Name}</span>
                          <span style={{fontSize:'9px',color:'rgba(255,255,255,0.25)'}}>{n.Category}</span>
                        </div>
                        <p style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{n.Note_Detail}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}