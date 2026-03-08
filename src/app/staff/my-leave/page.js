"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

const S = {
  page:   { minHeight:'100vh', background:'#0f172a', color:'#fff', fontFamily:'system-ui,sans-serif', paddingBottom:'80px' },
  header: { position:'sticky', top:0, zIndex:40, background:'rgba(15,23,42,0.97)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,0.07)', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' },
  card:   { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px', padding:'16px' },
  input:  { width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'12px', padding:'10px 14px', color:'#fff', fontSize:'13px', outline:'none', boxSizing:'border-box' },
  label:  { display:'block', fontSize:'9px', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'6px' },
  tabOn:  { background:'#fbbf24', color:'#0f172a', border:'none', borderRadius:'10px', padding:'7px 16px', fontSize:'10px', fontWeight:900, textTransform:'uppercase', cursor:'pointer', whiteSpace:'nowrap' },
  tabOff: { background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.4)', border:'none', borderRadius:'10px', padding:'7px 16px', fontSize:'10px', fontWeight:900, textTransform:'uppercase', cursor:'pointer', whiteSpace:'nowrap' },
};
const SC = {
  Approved: { bg:'rgba(52,211,153,0.1)',  text:'#34d399', border:'rgba(52,211,153,0.2)' },
  Rejected: { bg:'rgba(248,113,113,0.1)', text:'#f87171', border:'rgba(248,113,113,0.2)' },
  Pending:  { bg:'rgba(251,191,36,0.1)',  text:'#fbbf24', border:'rgba(251,191,36,0.2)' },
};
const LEAVE_DEFAULTS = ['Casual Leave','Medical Leave','Emergency Leave','Personal Leave'];
const getDisplayName = s => s['Name (ALL CAPITAL)'] || s['အမည်'] || s.Name || '';

export default function StaffMyLeavePage() {
  const router = useRouter();
  const [user, setUser]             = useState(null);
  const [canSubmit, setCanSubmit]   = useState(false);
  const [tab, setTab]               = useState('balance');
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [history, setHistory]       = useState([]);
  const [allStaff, setAllStaff]     = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState(null);

  // My own leave
  const [myForm, setMyForm] = useState({ Leave_Type:'', Start_Date:'', End_Date:'', Reason:'' });

  // Submit for others
  const [otherTarget, setOtherTarget] = useState('STAFF');
  const [otherSearch, setOtherSearch] = useState('');
  const [otherSel, setOtherSel]       = useState(null);
  const [otherForm, setOtherForm] = useState({
    Leave_Type:'Casual Leave', Start_Date:'', End_Date:'', Reason:'',
    Reporter_Name:'', Relationship:'', Phone:'', Method:'Phone Call'
  });

  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
    if (!auth) { router.push('/login'); return; }
    setUser(auth);
    const perm = auth['Can_Record_Attendance_&_Leave'];
    const can = perm === true || String(perm).toUpperCase() === 'TRUE';
    setCanSubmit(can);
    fetchData(auth, can);
  }, []);

  const fetchData = async (auth, can) => {
    setLoading(true);
    try {
      const calls = [
        fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'getStaffLeaveBalance', Staff_ID: auth.Staff_ID||'', Name: auth.Name||auth['Name (ALL CAPITAL)']||'' }) }),
        ...(can ? [fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'getInitialData' }) })] : [])
      ];
      const results = await Promise.all(calls);
      const balRes = await results[0].json();
      if (balRes.success) {
        setLeaveTypes(balRes.leaveTypes || []);
        setHistory(balRes.history || []);
        if (balRes.leaveTypes?.length > 0)
          setMyForm(f => ({ ...f, Leave_Type: f.Leave_Type || balRes.leaveTypes[0].type }));
      }
      if (can && results[1]) {
        const init = await results[1].json();
        if (init.success) {
          const active = s => String(s.Status||'TRUE').toUpperCase() !== 'FALSE';
          setAllStaff((init.staffList||init.staff||[]).filter(active));
          setAllStudents((init.students||[]).filter(active));
        }
      }
    } catch {}
    setLoading(false);
  };

  const showMsg = (text, type='success') => { setMsg({text,type}); setTimeout(()=>setMsg(null),3500); };
  const calcDays = (s,e) => { if(!s||!e) return 0; const d=Math.ceil((new Date(e)-new Date(s))/86400000)+1; return d>0?d:0; };

  const handleMySubmit = async () => {
    if (!myForm.Leave_Type)    return showMsg('Leave Type ရွေးပါ','error');
    if (!myForm.Start_Date)    return showMsg('Start Date ထည့်ပါ','error');
    if (!myForm.End_Date)      return showMsg('End Date ထည့်ပါ','error');
    if (!myForm.Reason.trim()) return showMsg('Reason ဖြည့်ပါ','error');
    if (myForm.End_Date < myForm.Start_Date) return showMsg('End Date မှားနေသည်','error');
    const days = calcDays(myForm.Start_Date, myForm.End_Date);
    const lt = leaveTypes.find(t=>t.type===myForm.Leave_Type);
    if (lt && days > lt.balance) return showMsg(`${myForm.Leave_Type}: balance ${lt.balance} days ကျန်သည်`,'error');
    setSaving(true);
    try {
      const res = await fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({
        action:'submitStaffLeave', Staff_ID:user.Staff_ID||'',
        Name:user.Name||user['Name (ALL CAPITAL)']||'',
        Leave_Type:myForm.Leave_Type, Start_Date:myForm.Start_Date,
        End_Date:myForm.End_Date, Total_Days:days, Reason:myForm.Reason.trim(),
      })});
      const r = await res.json();
      if (r.success) { showMsg('Leave request တင်ပြီး ✓'); setMyForm(f=>({...f,Start_Date:'',End_Date:'',Reason:''})); fetchData(user,canSubmit); setTab('history'); }
      else showMsg(r.message||'Error','error');
    } catch { showMsg('Network error','error'); }
    setSaving(false);
  };

  const handleOtherSubmit = async () => {
    if (!otherSel)                return showMsg('တစ်ဦး ရွေးပါ','error');
    if (!otherForm.Leave_Type)    return showMsg('Leave Type ရွေးပါ','error');
    if (!otherForm.Start_Date)    return showMsg('Start Date ထည့်ပါ','error');
    if (!otherForm.End_Date)      return showMsg('End Date ထည့်ပါ','error');
    if (!otherForm.Reason.trim()) return showMsg('Reason ဖြည့်ပါ','error');
    if (otherTarget==='STUDENT' && !otherForm.Reporter_Name.trim()) return showMsg('Reporter Name ဖြည့်ပါ','error');
    if (otherTarget==='STUDENT' && !otherForm.Phone.trim()) return showMsg('Phone ဖြည့်ပါ','error');
    if (otherForm.End_Date < otherForm.Start_Date) return showMsg('End Date မှားနေသည်','error');
    const days = calcDays(otherForm.Start_Date, otherForm.End_Date);
    setSaving(true);
    try {
      const isStaff = otherTarget === 'STAFF';
      const entry = [{
        Date_Applied: new Date().toLocaleDateString('en-CA'),
        User_Type: otherTarget,
        User_ID: otherSel['Enrollment No.'] || otherSel.Student_ID || otherSel.Staff_ID || '',
        Name: getDisplayName(otherSel),
        Leave_Type: otherForm.Leave_Type,
        Start_Date: otherForm.Start_Date,
        End_Date: otherForm.End_Date,
        Total_Days: days,
        Reason: otherForm.Reason.trim(),
        Reporter_Name: isStaff ? (user.Name||user.username||'Staff') : otherForm.Reporter_Name,
        Relationship: isStaff ? 'Staff' : otherForm.Relationship,
        Phone: isStaff ? '-' : otherForm.Phone,
        Method: isStaff ? 'Direct' : otherForm.Method,
        Approved_By: '-', Status: 'Pending'
      }];
      const res = await fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'recordNote', sheetName:'Leave_Records', data: entry }) });
      const r = await res.json();
      if (r.success) {
        showMsg('Leave Form တင်ပြီး ✓');
        setOtherSel(null); setOtherSearch('');
        setOtherForm(f=>({...f,Start_Date:'',End_Date:'',Reason:'',Reporter_Name:'',Relationship:'',Phone:''}));
      } else showMsg(r.message||'Error','error');
    } catch { showMsg('Network error','error'); }
    setSaving(false);
  };

  const myDays  = calcDays(myForm.Start_Date, myForm.End_Date);
  const othDays = calcDays(otherForm.Start_Date, otherForm.End_Date);
  const totalAlloc = leaveTypes.reduce((s,t)=>s+t.allocated,0);
  const totalUsed  = leaveTypes.reduce((s,t)=>s+t.used,0);
  const totalBal   = leaveTypes.reduce((s,t)=>s+t.balance,0);

  const otherList = otherTarget==='STAFF' ? allStaff : allStudents;
  const filteredOther = otherSearch.length >= 2
    ? otherList.filter(s => {
        const n = (s['Name (ALL CAPITAL)'] || s.Name || '').toLowerCase();
        const m = s['အမည်'] || '';
        const id = s['Enrollment No.'] || s.Staff_ID || s.Student_ID || '';
        return n.includes(otherSearch.toLowerCase()) || m.includes(otherSearch) || id.includes(otherSearch);
      }).slice(0,8)
    : [];

  const leaveOpts = leaveTypes.length > 0 ? leaveTypes.map(t=>t.type) : LEAVE_DEFAULTS;

  return (
    <div style={S.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}input[type=date]::-webkit-calendar-picker-indicator{filter:invert(1);opacity:0.5}textarea,select{font-family:inherit}`}</style>

      <div style={S.header}>
        <button onClick={()=>router.back()} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:'14px'}}>← Back</button>
        <div style={{textAlign:'center'}}>
          <p style={{fontWeight:900,fontSize:'13px',textTransform:'uppercase',letterSpacing:'0.1em',margin:0}}>My Leave</p>
          <p style={{fontSize:'9px',color:'rgba(255,255,255,0.25)',textTransform:'uppercase',letterSpacing:'0.12em',margin:0}}>{user?.Name||''}</p>
        </div>
        <button onClick={()=>fetchData(user,canSubmit)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:'18px'}}>↻</button>
      </div>

      {msg && (
        <div style={{position:'fixed',top:'64px',left:'50%',transform:'translateX(-50%)',zIndex:50,padding:'8px 20px',borderRadius:'999px',fontSize:'12px',fontWeight:900,color:'#fff',background:msg.type==='error'?'#ef4444':'#10b981',boxShadow:'0 4px 20px rgba(0,0,0,0.4)',whiteSpace:'nowrap'}}>
          {msg.text}
        </div>
      )}

      <div style={{display:'flex',gap:'6px',padding:'12px 16px 8px',overflowX:'auto'}}>
        {[
          {id:'balance', label:'📊 Balance'},
          {id:'apply',   label:'📝 My Leave'},
          ...(canSubmit ? [{id:'others', label:'📋 Submit for Others'}] : []),
          {id:'history', label:'🕐 History'},
        ].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={tab===t.id?S.tabOn:S.tabOff}>{t.label}</button>
        ))}
      </div>

      <div style={{padding:'0 16px'}}>
        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:'60px 0'}}>
            <div style={{width:'32px',height:'32px',border:'3px solid rgba(255,255,255,0.1)',borderTop:'3px solid #fbbf24',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
          </div>
        ) : (
          <>
            {/* BALANCE */}
            {tab==='balance' && (
              <div style={{display:'flex',flexDirection:'column',gap:'12px',marginTop:'8px'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
                  {[{label:'Allocated',value:totalAlloc,color:'#60a5fa'},{label:'Used',value:totalUsed,color:'#f87171'},{label:'Balance',value:totalBal,color:'#34d399'}].map(s=>(
                    <div key={s.label} style={{...S.card,textAlign:'center',padding:'12px 8px'}}>
                      <p style={{fontSize:'22px',fontWeight:900,color:s.color,margin:'0 0 2px'}}>{s.value}</p>
                      <p style={{fontSize:'8px',color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:'0.1em',margin:0}}>{s.label}</p>
                    </div>
                  ))}
                </div>
                {leaveTypes.map((lt,i)=>{
                  const pct=lt.allocated>0?Math.max(0,Math.min(100,(lt.used/lt.allocated)*100)):0;
                  const bc=lt.balance<=0?'#f87171':lt.balance<=2?'#fbbf24':'#34d399';
                  return (
                    <div key={i} style={S.card}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'10px'}}>
                        <p style={{fontWeight:900,fontSize:'13px',color:'#fff',margin:0}}>{lt.type}</p>
                        <div><span style={{fontWeight:900,fontSize:'18px',color:bc}}>{lt.balance}</span><span style={{fontSize:'9px',color:'rgba(255,255,255,0.3)',marginLeft:'3px'}}>/ {lt.allocated} days</span></div>
                      </div>
                      <div style={{height:'6px',background:'rgba(255,255,255,0.06)',borderRadius:'99px',overflow:'hidden'}}><div style={{height:'100%',width:`${pct}%`,background:pct>=100?'#f87171':'#fbbf24',borderRadius:'99px'}}/></div>
                      <div style={{display:'flex',justifyContent:'space-between',marginTop:'5px'}}>
                        <span style={{fontSize:'9px',color:'rgba(255,255,255,0.3)'}}>Used: {lt.used}</span>
                        <span style={{fontSize:'9px',color:bc,fontWeight:900}}>Remaining: {lt.balance} days</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* MY LEAVE */}
            {tab==='apply' && (
              <div style={{display:'flex',flexDirection:'column',gap:'12px',marginTop:'8px'}}>
                <div style={S.card}>
                  <label style={S.label}>Leave Type</label>
                  <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                    {leaveOpts.map(lt=>(
                      <button key={lt} onClick={()=>setMyForm(f=>({...f,Leave_Type:lt}))}
                        style={{padding:'7px 14px',borderRadius:'99px',border:'none',cursor:'pointer',fontWeight:900,fontSize:'10px',background:myForm.Leave_Type===lt?'#fbbf24':'rgba(255,255,255,0.06)',color:myForm.Leave_Type===lt?'#0f172a':'rgba(255,255,255,0.5)'}}>
                        {lt}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={S.card}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                    <div><label style={S.label}>Start Date</label><input type="date" value={myForm.Start_Date} onChange={e=>setMyForm(f=>({...f,Start_Date:e.target.value}))} style={S.input}/></div>
                    <div><label style={S.label}>End Date</label><input type="date" value={myForm.End_Date} min={myForm.Start_Date} onChange={e=>setMyForm(f=>({...f,End_Date:e.target.value}))} style={S.input}/></div>
                  </div>
                  {myDays>0&&<p style={{fontSize:'10px',color:'#fbbf24',fontWeight:900,margin:'8px 0 0',textAlign:'center'}}>{myDays} day{myDays>1?'s':''}</p>}
                </div>
                <div style={S.card}>
                  <label style={S.label}>Reason</label>
                  <textarea value={myForm.Reason} onChange={e=>setMyForm(f=>({...f,Reason:e.target.value}))} placeholder="Leave ယူရသည့် အကြောင်းပြချက်..." rows={3} style={{...S.input,resize:'none'}}/>
                </div>
                <button onClick={handleMySubmit} disabled={saving}
                  style={{background:'#fbbf24',color:'#0f172a',border:'none',borderRadius:'14px',padding:'14px',fontSize:'13px',fontWeight:900,width:'100%',cursor:saving?'default':'pointer',textTransform:'uppercase',opacity:saving?0.5:1}}>
                  {saving?'Submitting...':'📤 Submit My Leave'+(myDays>0?' ('+myDays+' days)':'')}
                </button>
              </div>
            )}

            {/* SUBMIT FOR OTHERS */}
            {tab==='others' && canSubmit && (
              <div style={{display:'flex',flexDirection:'column',gap:'12px',marginTop:'8px'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                  {[{id:'STAFF',icon:'👔',label:'Staff'},{id:'STUDENT',icon:'👨‍🎓',label:'Student'}].map(t=>(
                    <button key={t.id} onClick={()=>{setOtherTarget(t.id);setOtherSel(null);setOtherSearch('');}}
                      style={{padding:'12px',borderRadius:'14px',cursor:'pointer',fontWeight:900,fontSize:'12px',background:otherTarget===t.id?'#fbbf24':'rgba(255,255,255,0.05)',color:otherTarget===t.id?'#0f172a':'rgba(255,255,255,0.4)',border:otherTarget===t.id?'none':'1px solid rgba(255,255,255,0.08)'}}>
                      <div style={{fontSize:'20px',marginBottom:'4px'}}>{t.icon}</div>{t.label}
                    </button>
                  ))}
                </div>

                <div style={S.card}>
                  <label style={S.label}>{otherTarget==='STAFF'?'Staff':'Student'} ရွေးပါ</label>
                  {otherSel ? (
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(251,191,36,0.08)',border:'1px solid rgba(251,191,36,0.3)',borderRadius:'12px',padding:'10px 14px'}}>
                      <div>
                        <p style={{fontWeight:900,fontSize:'13px',color:'#fbbf24',margin:0}}>{getDisplayName(otherSel)}</p>
                        <p style={{fontSize:'9px',color:'rgba(255,255,255,0.4)',margin:'2px 0 0'}}>{otherSel['Enrollment No.']||otherSel.Staff_ID}</p>
                      </div>
                      <button onClick={()=>{setOtherSel(null);setOtherSearch('');}} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:'16px'}}>✕</button>
                    </div>
                  ) : (
                    <div style={{position:'relative'}}>
                      <input value={otherSearch} onChange={e=>setOtherSearch(e.target.value)}
                        placeholder="နာမည် သို့ ID ရိုက်ပါ..." style={S.input} autoComplete="off"/>
                      {filteredOther.length>0&&(
                        <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:20,background:'#0f172a',border:'1px solid rgba(255,255,255,0.12)',borderRadius:'12px',marginTop:'4px',overflow:'hidden',maxHeight:'200px',overflowY:'auto'}}>
                          {filteredOther.map((s,i)=>(
                            <button key={i} onClick={()=>{setOtherSel(s);setOtherSearch('');}}
                              style={{width:'100%',padding:'10px 14px',background:'none',border:'none',color:'#fff',cursor:'pointer',textAlign:'left',borderBottom:i<filteredOther.length-1?'1px solid rgba(255,255,255,0.05)':'none'}}>
                              <div style={{fontSize:'12px',fontWeight:700}}>{getDisplayName(s)}</div>
                              <div style={{fontSize:'9px',color:'rgba(255,255,255,0.35)'}}>{s['Enrollment No.']||s.Staff_ID}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={S.card}>
                  <label style={S.label}>Leave Type</label>
                  <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                    {leaveOpts.map(lt=>(
                      <button key={lt} onClick={()=>setOtherForm(f=>({...f,Leave_Type:lt}))}
                        style={{padding:'7px 14px',borderRadius:'99px',border:'none',cursor:'pointer',fontWeight:900,fontSize:'10px',background:otherForm.Leave_Type===lt?'#fbbf24':'rgba(255,255,255,0.06)',color:otherForm.Leave_Type===lt?'#0f172a':'rgba(255,255,255,0.5)'}}>
                        {lt}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={S.card}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                    <div><label style={S.label}>Start Date</label><input type="date" value={otherForm.Start_Date} onChange={e=>setOtherForm(f=>({...f,Start_Date:e.target.value}))} style={S.input}/></div>
                    <div><label style={S.label}>End Date</label><input type="date" value={otherForm.End_Date} min={otherForm.Start_Date} onChange={e=>setOtherForm(f=>({...f,End_Date:e.target.value}))} style={S.input}/></div>
                  </div>
                  {othDays>0&&<p style={{fontSize:'10px',color:'#fbbf24',fontWeight:900,margin:'8px 0 0',textAlign:'center'}}>{othDays} day{othDays>1?'s':''}</p>}
                </div>

                <div style={S.card}>
                  <label style={S.label}>Reason</label>
                  <textarea value={otherForm.Reason} onChange={e=>setOtherForm(f=>({...f,Reason:e.target.value}))} placeholder="Leave ယူရသည့် အကြောင်းပြချက်..." rows={2} style={{...S.input,resize:'none'}}/>
                </div>

                {otherTarget==='STUDENT' && (
                  <div style={S.card}>
                    <p style={{fontSize:'9px',color:'rgba(255,255,255,0.35)',textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 10px'}}>Reporter (မိဘ / အုပ်ထိန်းသူ)</p>
                    <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                      <div><label style={S.label}>Reporter Name</label><input value={otherForm.Reporter_Name} onChange={e=>setOtherForm(f=>({...f,Reporter_Name:e.target.value}))} placeholder="မိဘ/အုပ်ထိန်းသူ နာမည်" style={S.input}/></div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                        <div><label style={S.label}>Relationship</label><input value={otherForm.Relationship} onChange={e=>setOtherForm(f=>({...f,Relationship:e.target.value}))} placeholder="မိခင် / ဖခင်..." style={S.input}/></div>
                        <div><label style={S.label}>Phone</label><input value={otherForm.Phone} onChange={e=>setOtherForm(f=>({...f,Phone:e.target.value}))} placeholder="09..." style={S.input}/></div>
                      </div>
                      <div><label style={S.label}>Method</label>
                        <select value={otherForm.Method} onChange={e=>setOtherForm(f=>({...f,Method:e.target.value}))} style={{...S.input,cursor:'pointer'}}>
                          {['Phone Call','In Person','Message','Email'].map(m=><option key={m} style={{background:'#0f172a'}}>{m}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <button onClick={handleOtherSubmit} disabled={saving}
                  style={{background:'#fbbf24',color:'#0f172a',border:'none',borderRadius:'14px',padding:'14px',fontSize:'13px',fontWeight:900,width:'100%',cursor:saving?'default':'pointer',textTransform:'uppercase',opacity:saving?0.5:1}}>
                  {saving?'Submitting...':'📤 Submit Leave Form'+(othDays>0?' ('+othDays+' days)':'')}
                </button>
              </div>
            )}

            {/* HISTORY */}
            {tab==='history' && (
              <div style={{display:'flex',flexDirection:'column',gap:'8px',marginTop:'8px'}}>
                {history.length===0?(
                  <div style={{textAlign:'center',padding:'50px 0',color:'rgba(255,255,255,0.2)'}}>Leave history မရှိသေးပါ</div>
                ):history.map((h,i)=>{
                  const sc=SC[h.Status]||SC.Pending;
                  return (
                    <div key={i} style={{...S.card,display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'12px'}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px',flexWrap:'wrap'}}>
                          <span style={{fontWeight:900,fontSize:'13px',color:'#fff'}}>{h.Leave_Type}</span>
                          <span style={{fontSize:'8px',fontWeight:900,padding:'2px 8px',borderRadius:'99px',background:sc.bg,color:sc.text,border:`1px solid ${sc.border}`}}>{h.Status}</span>
                        </div>
                        <p style={{fontSize:'10px',color:'rgba(255,255,255,0.4)',margin:'0 0 2px'}}>{h.Start_Date} → {h.End_Date}</p>
                        <p style={{fontSize:'9px',color:'rgba(255,255,255,0.25)',margin:0,fontStyle:'italic'}}>"{h.Reason}"</p>
                        {h.Approved_By&&h.Approved_By!=='-'&&<p style={{fontSize:'8px',color:'#34d399',margin:'3px 0 0'}}>✓ by {h.Approved_By}</p>}
                      </div>
                      <div style={{textAlign:'right',flexShrink:0}}>
                        <p style={{fontWeight:900,fontSize:'20px',color:'#fbbf24',margin:0}}>{h.Total_Days}</p>
                        <p style={{fontSize:'8px',color:'rgba(255,255,255,0.3)',margin:0}}>days</p>
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
  );
}