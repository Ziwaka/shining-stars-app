"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

const S = {
  page:     { minHeight:'100vh', background:'#fdfcf0', color:'#020617', fontFamily:'system-ui,sans-serif', paddingBottom:'80px' },
  header:   { background:'#020617', borderBottom:'6px solid #fbbf24', padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' },
  card:     { background:'#fff', border:'1px solid #f1f5f9', borderRadius:'20px', padding:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' },
  input:    { width:'100%', background:'#fdfcf0', border:'2px solid #e2e8f0', borderRadius:'14px', padding:'12px 14px', color:'#020617', fontSize:'13px', fontWeight:700, outline:'none', boxSizing:'border-box' },
  select:   { width:'100%', background:'#fdfcf0', border:'2px solid #e2e8f0', borderRadius:'14px', padding:'12px 14px', color:'#020617', fontSize:'13px', fontWeight:700, outline:'none', boxSizing:'border-box' },
  label:    { display:'block', fontSize:'9px', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.12em', fontWeight:900, marginBottom:'6px' },
  btnGold:  { background:'#fbbf24', color:'#020617', border:'none', borderRadius:'14px', padding:'14px', fontSize:'13px', fontWeight:900, width:'100%', cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.06em' },
  btnDark:  { background:'#020617', color:'#fbbf24', border:'none', borderRadius:'14px', padding:'14px', fontSize:'13px', fontWeight:900, width:'100%', cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.06em' },
  tabOn:    { background:'#020617', color:'#fff', border:'none', borderRadius:'10px', padding:'8px 16px', fontSize:'10px', fontWeight:900, textTransform:'uppercase', cursor:'pointer', whiteSpace:'nowrap' },
  tabOff:   { background:'rgba(0,0,0,0.04)', color:'#94a3b8', border:'none', borderRadius:'10px', padding:'8px 16px', fontSize:'10px', fontWeight:900, textTransform:'uppercase', cursor:'pointer', whiteSpace:'nowrap' },
};

const LEAVE_TYPES = ['Sick Leave','Medical Leave','Personal Leave','Urgent Affair'];
const METHODS     = ['Phone Call','Telegram','Viber','Directly'];

export default function StaffLeave() {
  const router = useRouter();
  const [user, setUser]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [registry, setRegistry] = useState({ students:[], staff:[], pending:[], history:[] });
  const [view, setView]         = useState('NEW');
  const [target, setTarget]     = useState('STUDENT');
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState('');
  const [msg, setMsg]           = useState(null);
  const [form, setForm] = useState({ type:'Sick Leave', start:'', end:'', reason:'', reporter:'', relation:'', phone:'', method:'Phone Call' });

  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
    if (!auth) { router.push('/login'); return; }
    const hasPerm = (key) => auth.userRole==='management' || auth[key]===true || String(auth[key]||'').toUpperCase()==='TRUE';
    if (!hasPerm('Can_Record_Attendance_&_Leave')) { router.push('/staff'); return; }
    setUser(auth);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'getInitialData' }) });
      const r   = await res.json();
      if (r.success) {
        const isActive = u => u.Status?.toString().toUpperCase() === 'TRUE';
        setRegistry({
          students: (r.students || []).filter(isActive),
          staff:    (r.staffList || r.staff || []).filter(isActive),
          pending:  (r.leaves || []).filter(x => x.Status === 'Pending'),
          history:  (r.leaves || []).filter(x => x.Status !== 'Pending').reverse(),
        });
      }
    } catch {}
    setLoading(false);
  };

  const showMsg = (text, type='success') => { setMsg({text,type}); setTimeout(()=>setMsg(null),3000); };

  const handleSubmit = async () => {
    if (!selected || !form.start || !form.end || !form.reason.trim())
      return showMsg('Dates နှင့် Reason ဖြည့်ပါ', 'error');
    if (target === 'STUDENT' && (!form.reporter.trim() || !form.relation.trim() || !form.phone.trim()))
      return showMsg('Reporter details ဖြည့်ပါ', 'error');
    setSaving(true);
    const days = Math.ceil(Math.abs(new Date(form.end) - new Date(form.start)) / 86400000) + 1;
    const entry = [{
      Date_Applied: new Date().toLocaleDateString('en-CA'),
      User_Type: target,
      User_ID: selected['Enrollment No.'] || selected['Staff_ID'],
      Name: selected['Name (ALL CAPITAL)'] || selected['Name'],
      Leave_Type: form.type, Start_Date: form.start, End_Date: form.end,
      Total_Days: days, Reason: form.reason,
      Reporter_Name: target==='STUDENT'?form.reporter:'-',
      Relationship:  target==='STUDENT'?form.relation:'-',
      Phone:  target==='STUDENT'?form.phone:'-',
      Method: target==='STUDENT'?form.method:'-',
      Approved_By:'-', Status:'Pending'
    }];
    try {
      const res = await fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'recordNote', sheetName:'Leave_Records', data:entry }) });
      const r   = await res.json();
      if (r.success) {
        showMsg('Leave တင်ပြီးပါပြီ ✓');
        setForm({ type:'Sick Leave', start:'', end:'', reason:'', reporter:'', relation:'', phone:'', method:'Phone Call' });
        setSelected(null); setSearch(''); setView('NEW');
        fetchData();
      } else showMsg(r.message||'Error','error');
    } catch { showMsg('Network error','error'); }
    setSaving(false);
  };

  const handleAuth = async (leave, status) => {
    if (user.userRole !== 'management') return showMsg('Management only','error');
    setSaving(true);
    try {
      const res = await fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'updateLeave', userId:leave.User_ID, name:leave.Name, startDate:leave.Start_Date, status, approvedBy:user.Name }) });
      if ((await res.json()).success) { showMsg(`${status} ✓`); fetchData(); setView('PENDING'); }
    } catch {}
    setSaving(false);
  };

  const filtered = (target==='STUDENT'?registry.students:registry.staff).filter(u => {
    if (!search) return false;
    const s = search.toLowerCase();
    return (u['Name (ALL CAPITAL)']||u['Name']||'').toLowerCase().includes(s) || (u['Enrollment No.']||u['Staff_ID']||'').toString().includes(s);
  });

  const getName = u => u['Name (ALL CAPITAL)'] || u['Name'] || '';
  const getID   = u => u['Enrollment No.'] || u['Staff_ID'] || '';

  return (
    <div style={S.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}`}</style>

      <div style={S.header}>
        <button onClick={()=>router.push('/staff')} style={{background:'#fbbf24',color:'#020617',border:'none',borderRadius:'10px',width:'36px',height:'36px',cursor:'pointer',fontSize:'16px',fontWeight:900}}>←</button>
        <div style={{flex:1,marginLeft:'10px'}}>
          <p style={{fontWeight:900,fontSize:'14px',color:'#fff',margin:0,textTransform:'uppercase',letterSpacing:'0.05em'}}>Leave Request</p>
          <p style={{fontSize:'9px',color:'#fbbf24',margin:0,letterSpacing:'0.2em',textTransform:'uppercase'}}>Shining Stars Hub</p>
        </div>
        <button onClick={fetchData} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:'18px'}}>↻</button>
      </div>

      {msg && (
        <div style={{position:'fixed',top:'70px',left:'50%',transform:'translateX(-50%)',zIndex:50,padding:'8px 20px',borderRadius:'999px',fontSize:'12px',fontWeight:900,color:'#fff',background:msg.type==='error'?'#ef4444':'#10b981',boxShadow:'0 4px 20px rgba(0,0,0,0.2)',whiteSpace:'nowrap'}}>
          {msg.text}
        </div>
      )}

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:'80px 0'}}>
          <div style={{width:'32px',height:'32px',border:'3px solid #e2e8f0',borderTop:'3px solid #fbbf24',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
        </div>
      ) : (
        <div style={{maxWidth:'600px',margin:'0 auto',padding:'16px',display:'flex',flexDirection:'column',gap:'12px'}}>

          {/* Tabs */}
          <div style={{display:'flex',gap:'6px',overflowX:'auto'}}>
            <button onClick={()=>setView('NEW')}     style={view==='NEW'?S.tabOn:S.tabOff}>✏️ New Request</button>
            <button onClick={()=>setView('PENDING')} style={view==='PENDING'?S.tabOn:S.tabOff}>⏳ Pending ({registry.pending.length})</button>
            <button onClick={()=>setView('HISTORY')} style={view==='HISTORY'?S.tabOn:S.tabOff}>📋 History</button>
          </div>

          {/* ── NEW LEAVE ── */}
          {view==='NEW' && !selected && (
            <>
              {/* Target toggle */}
              <div style={{display:'flex',background:'rgba(0,0,0,0.04)',padding:'4px',borderRadius:'14px',gap:'4px'}}>
                {['STUDENT','STAFF'].map(t=>(
                  <button key={t} onClick={()=>{setTarget(t);setSearch('');}}
                    style={{flex:1,padding:'10px',borderRadius:'10px',border:'none',cursor:'pointer',fontWeight:900,fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.05em',
                      background:target===t?'#020617':'transparent',color:target===t?'#fff':'#94a3b8'}}>
                    {t}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div style={S.card}>
                <label style={S.label}>နာမည် သို့ ID ရှာပါ</label>
                <input value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder={target==='STUDENT'?'Student name or ID...':'Staff name or ID...'}
                  style={S.input}/>
                {filtered.length > 0 && (
                  <div style={{marginTop:'8px',display:'flex',flexDirection:'column',gap:'6px',maxHeight:'300px',overflowY:'auto'}}>
                    {filtered.map((u,i)=>(
                      <button key={i} onClick={()=>{setSelected(u);setSearch('');}}
                        style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'12px',padding:'12px 14px',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',textAlign:'left'}}>
                        <div>
                          <p style={{fontWeight:900,fontSize:'13px',color:'#020617',margin:0}}>{getName(u)}</p>
                          <p style={{fontSize:'9px',color:'#94a3b8',margin:'2px 0 0',textTransform:'uppercase',letterSpacing:'0.1em'}}>ID: {getID(u)}</p>
                        </div>
                        <span style={{color:'#94a3b8',fontSize:'16px'}}>→</span>
                      </button>
                    ))}
                  </div>
                )}
                {search && filtered.length===0 && (
                  <p style={{textAlign:'center',color:'#94a3b8',fontSize:'12px',padding:'16px 0',margin:0}}>ရှာမတွေ့ပါ</p>
                )}
              </div>
            </>
          )}

          {/* FORM */}
          {view==='NEW' && selected && (
            <>
              {/* Selected user banner */}
              <div style={{background:'#fef9c3',border:'2px solid #fbbf24',borderRadius:'16px',padding:'14px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <p style={{fontSize:'9px',color:'#92400e',textTransform:'uppercase',letterSpacing:'0.12em',margin:'0 0 3px',fontWeight:900}}>Target</p>
                  <p style={{fontWeight:900,fontSize:'15px',color:'#020617',margin:0}}>{getName(selected)}</p>
                  <p style={{fontSize:'9px',color:'#92400e',margin:'2px 0 0'}}>ID: {getID(selected)}</p>
                </div>
                <button onClick={()=>setSelected(null)}
                  style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:'10px',padding:'6px 12px',color:'#64748b',fontSize:'11px',fontWeight:900,cursor:'pointer'}}>
                  ✕ Change
                </button>
              </div>

              {/* Leave type + dates */}
              <div style={S.card}>
                <div style={{marginBottom:'12px'}}>
                  <label style={S.label}>Leave Category</label>
                  <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={S.select}>
                    {LEAVE_TYPES.map(t=><option key={t} style={{background:'#fff'}}>{t}</option>)}
                  </select>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                  <div>
                    <label style={S.label}>Start Date *</label>
                    <input type="date" value={form.start} onChange={e=>setForm(f=>({...f,start:e.target.value}))} style={S.input}/>
                  </div>
                  <div>
                    <label style={S.label}>End Date *</label>
                    <input type="date" value={form.end} onChange={e=>setForm(f=>({...f,end:e.target.value}))} style={S.input}/>
                  </div>
                </div>
                {form.start && form.end && new Date(form.end) >= new Date(form.start) && (
                  <div style={{marginTop:'10px',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'10px',padding:'8px 12px',textAlign:'center'}}>
                    <span style={{fontWeight:900,fontSize:'18px',color:'#16a34a'}}>
                      {Math.ceil(Math.abs(new Date(form.end)-new Date(form.start))/86400000)+1}
                    </span>
                    <span style={{fontSize:'10px',color:'#16a34a',marginLeft:'6px',fontWeight:700}}>days</span>
                  </div>
                )}
              </div>

              {/* Student reporter info */}
              {target==='STUDENT' && (
                <div style={{...S.card,background:'#fffbeb',border:'1px solid rgba(251,191,36,0.3)'}}>
                  <p style={{...S.label,marginBottom:'12px',color:'#92400e'}}>ခွင့်တိုင်သူ အချက်အလက်</p>
                  <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                      <input value={form.reporter} onChange={e=>setForm(f=>({...f,reporter:e.target.value}))}
                        placeholder="Reporter Name *" style={{...S.input,background:'#fff'}}/>
                      <input value={form.relation} onChange={e=>setForm(f=>({...f,relation:e.target.value}))}
                        placeholder="Relationship *" style={{...S.input,background:'#fff'}}/>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                      <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}
                        placeholder="Phone *" type="tel" style={{...S.input,background:'#fff'}}/>
                      <select value={form.method} onChange={e=>setForm(f=>({...f,method:e.target.value}))}
                        style={{...S.select,background:'#fff'}}>
                        {METHODS.map(m=><option key={m} style={{background:'#fff'}}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Reason */}
              <div style={S.card}>
                <label style={{...S.label,color:'#ef4444'}}>Reason *</label>
                <textarea rows={4} value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))}
                  placeholder="အကြောင်းပြချက် ရေးပါ..."
                  style={{...S.input,resize:'vertical',minHeight:'90px'}}/>
              </div>

              <button onClick={handleSubmit} disabled={saving}
                style={{...S.btnDark,opacity:saving?0.5:1,cursor:saving?'default':'pointer'}}>
                {saving?'Submitting...':'Submit Leave Request ★'}
              </button>
            </>
          )}

          {/* ── PENDING ── */}
          {view==='PENDING' && (
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              {registry.pending.length===0 ? (
                <div style={{textAlign:'center',padding:'50px 0',color:'#94a3b8'}}>
                  <div style={{fontSize:'32px',marginBottom:'8px'}}>✓</div>
                  <p style={{fontWeight:900}}>Pending leaves မရှိပါ</p>
                </div>
              ) : registry.pending.map((l,i)=>(
                <div key={i} style={{...S.card}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px'}}>
                    <div>
                      <span style={{background:'#fef9c3',border:'1px solid #fbbf24',color:'#92400e',fontSize:'8px',fontWeight:900,padding:'2px 10px',borderRadius:'99px',textTransform:'uppercase'}}>{l.User_Type}</span>
                      <p style={{fontWeight:900,fontSize:'15px',color:'#020617',margin:'6px 0 2px'}}>{l.Name}</p>
                      <p style={{fontSize:'9px',color:'#94a3b8',margin:0}}>{l.Leave_Type} · {l.Total_Days} days · {l.Start_Date} → {l.End_Date}</p>
                    </div>
                    <p style={{fontSize:'9px',color:'#94a3b8',flexShrink:0,marginLeft:'8px'}}>{l.Date_Applied}</p>
                  </div>
                  <div style={{background:'#f8fafc',borderLeft:'3px solid #7c3aed',borderRadius:'10px',padding:'10px 12px',marginBottom:'10px'}}>
                    <p style={{fontSize:'12px',color:'#334155',margin:0,fontStyle:'italic'}}>"{l.Reason}"</p>
                  </div>
                  {l.User_Type==='STUDENT' && (
                    <p style={{fontSize:'9px',color:'#94a3b8',margin:'0 0 10px'}}>By: {l.Reporter_Name} ({l.Relationship}) · {l.Phone} · {l.Method}</p>
                  )}
                  {user?.userRole==='management' ? (
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                      <button onClick={()=>handleAuth(l,'Approved')} disabled={saving}
                        style={{background:'#020617',color:'#fff',border:'none',borderRadius:'12px',padding:'10px',fontSize:'11px',fontWeight:900,cursor:'pointer',textTransform:'uppercase'}}>
                        ✓ Approve
                      </button>
                      <button onClick={()=>handleAuth(l,'Rejected')} disabled={saving}
                        style={{background:'#fff',color:'#ef4444',border:'2px solid #fecaca',borderRadius:'12px',padding:'10px',fontSize:'11px',fontWeight:900,cursor:'pointer',textTransform:'uppercase'}}>
                        ✕ Reject
                      </button>
                    </div>
                  ) : (
                    <div style={{background:'#020617',color:'#fbbf24',borderRadius:'10px',padding:'8px',textAlign:'center',fontSize:'10px',fontWeight:900,textTransform:'uppercase',letterSpacing:'0.1em'}}>Awaiting Authorization</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── HISTORY ── */}
          {view==='HISTORY' && (
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {registry.history.length===0 ? (
                <div style={{textAlign:'center',padding:'50px 0',color:'#94a3b8'}}>History မရှိသေးပါ</div>
              ) : registry.history.slice(0,30).map((l,i)=>(
                <div key={i} style={{...S.card,padding:'12px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',borderLeft:`4px solid ${l.Status==='Approved'?'#10b981':'#ef4444'}`}}>
                  <div>
                    <p style={{fontWeight:900,fontSize:'12px',color:'#020617',margin:'0 0 2px'}}>{l.Name}</p>
                    <p style={{fontSize:'9px',color:'#94a3b8',margin:0}}>{l.Leave_Type} · {l.Total_Days}d · {l.Start_Date}</p>
                  </div>
                  <span style={{fontSize:'9px',fontWeight:900,padding:'3px 10px',borderRadius:'99px',flexShrink:0,
                    background:l.Status==='Approved'?'#dcfce7':'#fee2e2',
                    color:l.Status==='Approved'?'#16a34a':'#dc2626'}}>
                    {l.Status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}