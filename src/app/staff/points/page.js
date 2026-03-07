"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

const S = {
  page:     { minHeight:'100vh', background:'#0f0a1e', color:'#fff', fontFamily:'system-ui,sans-serif', paddingBottom:'80px' },
  header:   { position:'sticky', top:0, zIndex:40, background:'rgba(15,10,30,0.97)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,0.07)', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' },
  card:     { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'16px', padding:'16px' },
  input:    { width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'12px', padding:'10px 14px', color:'#fff', fontSize:'13px', outline:'none', boxSizing:'border-box' },
  label:    { display:'block', fontSize:'9px', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'6px' },
  btn:      { background:'#fbbf24', color:'#0f172a', border:'none', borderRadius:'14px', padding:'13px', fontSize:'13px', fontWeight:900, width:'100%', cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.06em' },
  btnRed:   { background:'#ef4444', color:'#fff', border:'none', borderRadius:'14px', padding:'13px', fontSize:'13px', fontWeight:900, width:'100%', cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.06em' },
  tabOn:    { background:'#fbbf24', color:'#0f172a', border:'none', borderRadius:'10px', padding:'7px 16px', fontSize:'10px', fontWeight:900, textTransform:'uppercase', cursor:'pointer', whiteSpace:'nowrap' },
  tabOff:   { background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.4)', border:'none', borderRadius:'10px', padding:'7px 16px', fontSize:'10px', fontWeight:900, textTransform:'uppercase', cursor:'pointer', whiteSpace:'nowrap' },
};

const HOUSE_COLORS = {
  'အနော်ရထာ':       { bg:'rgba(239,68,68,0.15)',  border:'rgba(239,68,68,0.4)',  text:'#f87171',  medal:'🔴' },
  'ဗညားဒလ':        { bg:'rgba(59,130,246,0.15)', border:'rgba(59,130,246,0.4)', text:'#60a5fa',  medal:'🔵' },
  'မင်းဒေါင်းဆိပ်': { bg:'rgba(34,197,94,0.15)',  border:'rgba(34,197,94,0.4)',  text:'#4ade80',  medal:'🟢' },
  'စစ်ကိုင်းမင်':   { bg:'rgba(168,85,247,0.15)', border:'rgba(168,85,247,0.4)', text:'#c084fc',  medal:'🟣' },
};
const DEFAULT_COLOR = { bg:'rgba(255,255,255,0.05)', border:'rgba(255,255,255,0.1)', text:'#fbbf24', medal:'⭐' };
const houseColor = (h) => HOUSE_COLORS[h] || DEFAULT_COLOR;
const RANK_ICONS = ['🥇','🥈','🥉','4️⃣','5️⃣'];

export default function StaffHousePointsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('award'); // award | deduct | leaderboard | history
  const [categories, setCategories] = useState([]);
  const [houses, setHouses] = useState([]);
  const [students, setStudents] = useState([]);
  const [points, setPoints] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ Student_ID:'', Name:'', House_Name:'', Category:'', Points:'', Event_Name:'', Remark:'' });

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    if (u.userRole !== 'staff' && u.userRole !== 'management') { router.push('/login'); return; }
    setUser(u);
    fetchAll(u);
  }, []);

  const fetchAll = async (u) => {
    setLoading(true);
    try {
      const [cfgRes, ptRes, stuRes] = await Promise.all([
        fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'getHouseConfig' }) }),
        fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'getHousePoints', recordedBy: u?.Name || u?.name }) }),
        fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'getData', sheetName:'Student_Directory' }) }),
      ]);
      const cfg = await cfgRes.json();
      const pt  = await ptRes.json();
      const stu = await stuRes.json();
      if (cfg.success) { setCategories(cfg.categories || []); setHouses(cfg.houses || []); }
      if (pt.success)  { setPoints(pt.data || []); setLeaderboard(pt.leaderboard || []); }
      if (stu.success) setStudents(stu.data || []);
    } catch {}
    setLoading(false);
  };

  const showMsg = (text, type='success') => { setMsg({text,type}); setTimeout(()=>setMsg(null),3500); };

  const selectStudent = (stu) => {
    setForm(f => ({
      ...f,
      Student_ID: stu['Enrollment No.'] || stu.Student_ID || '',
      Name: stu['Name (ALL CAPITAL)'] || stu['အမည်'] || '',
      House_Name: stu.House || '',
    }));
    setSearch('');
  };

  const handleSubmit = async (type) => {
    if (!form.Student_ID) return showMsg('Student ရွေးပါ', 'error');
    if (!form.Category)   return showMsg('Category ရွေးပါ', 'error');
    if (!form.Points || Number(form.Points) <= 0) return showMsg('Points ထည့်ပါ', 'error');

    const cat = categories.find(c => c.name === form.Category);
    if (cat && Number(form.Points) > cat.maxPoints) {
      return showMsg(`${form.Category} အတွက် max ${cat.maxPoints} pts သာ ခွင့်ပြု`, 'error');
    }

    setSaving(true);
    try {
      const res = await fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({
        action:'recordHousePoint', Type: type,
        Student_ID: form.Student_ID, Name: form.Name, House_Name: form.House_Name,
        Category: form.Category, Points: form.Points,
        Event_Name: form.Event_Name || form.Category,
        Remark: form.Remark, Recorded_By: user?.Name || user?.name || user?.username,
      })});
      const r = await res.json();
      if (r.success) {
        showMsg(r.message);
        setForm({ Student_ID:'', Name:'', House_Name:'', Category:'', Points:'', Event_Name:'', Remark:'' });
        fetchAll(user);
      } else showMsg(r.message || 'Error', 'error');
    } catch { showMsg('Network error', 'error'); }
    setSaving(false);
  };

  const filteredStudents = search.length >= 2
    ? students.filter(s => {
        const name = (s['Name (ALL CAPITAL)'] || s['အမည်'] || '').toLowerCase();
        const id = (s['Enrollment No.'] || s.Student_ID || '').toLowerCase();
        return name.includes(search.toLowerCase()) || id.includes(search.toLowerCase());
      }).slice(0, 8)
    : [];

  const myHistory = points.filter(p => p.Recorded_By === (user?.Name || user?.name || user?.username));

  const FormContent = ({ type }) => (
    <div style={{display:'flex',flexDirection:'column',gap:'12px',marginTop:'8px'}}>
      {/* Student Search */}
      <div style={S.card}>
        <label style={S.label}>Student ရွေးပါ</label>
        {form.Student_ID ? (
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(251,191,36,0.08)',border:'1px solid rgba(251,191,36,0.3)',borderRadius:'12px',padding:'10px 14px'}}>
            <div>
              <p style={{fontWeight:900,fontSize:'13px',color:'#fbbf24',margin:0}}>{form.Name}</p>
              <p style={{fontSize:'9px',color:'rgba(255,255,255,0.4)',margin:'2px 0 0'}}>{form.Student_ID} · {form.House_Name}</p>
            </div>
            <button onClick={()=>setForm(f=>({...f,Student_ID:'',Name:'',House_Name:''}))}
              style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:'16px'}}>✕</button>
          </div>
        ) : (
          <div style={{position:'relative'}}>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="နာမည် သို့ ID ရိုက်ပါ (2+ လုံး)..." style={S.input}/>
            {filteredStudents.length > 0 && (
              <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:20,background:'#1a1030',border:'1px solid rgba(255,255,255,0.12)',borderRadius:'12px',marginTop:'4px',overflow:'hidden'}}>
                {filteredStudents.map((s,i) => (
                  <button key={i} onClick={()=>selectStudent(s)}
                    style={{width:'100%',padding:'10px 14px',background:'none',border:'none',color:'#fff',cursor:'pointer',textAlign:'left',borderBottom:i<filteredStudents.length-1?'1px solid rgba(255,255,255,0.05)':'none',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:'12px',fontWeight:700}}>{s['Name (ALL CAPITAL)'] || s['အမည်']}</span>
                    <span style={{fontSize:'9px',color:'rgba(255,255,255,0.4)'}}>{s['Enrollment No.']} · {s.House}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category */}
      <div style={S.card}>
        <label style={S.label}>Category (System မှ သတ်မှတ်)</label>
        <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
          {categories.map(c => (
            <button key={c.name} onClick={()=>setForm(f=>({...f,Category:c.name,Points:''}))}
              style={{padding:'7px 14px',borderRadius:'99px',border:'none',cursor:'pointer',fontWeight:900,fontSize:'10px',
                background:form.Category===c.name?'#fbbf24':'rgba(255,255,255,0.06)',
                color:form.Category===c.name?'#0f172a':'rgba(255,255,255,0.5)'}}>
              {c.name} <span style={{opacity:0.6}}>≤{c.maxPoints}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Points */}
      <div style={S.card}>
        <label style={S.label}>
          Points {form.Category && categories.find(c=>c.name===form.Category) ? `(max: ${categories.find(c=>c.name===form.Category).maxPoints})` : ''}
        </label>
        <input type="number" min="1"
          max={form.Category ? (categories.find(c=>c.name===form.Category)?.maxPoints || 999) : 999}
          value={form.Points} onChange={e=>setForm(f=>({...f,Points:e.target.value}))}
          placeholder="0" style={S.input}/>
      </div>

      {/* Optional fields */}
      <div style={S.card}>
        <label style={S.label}>Event / ရည်ညွှန်းချက် (optional)</label>
        <input value={form.Event_Name} onChange={e=>setForm(f=>({...f,Event_Name:e.target.value}))}
          placeholder="e.g. Science Quiz, Clean Classroom..." style={S.input}/>
        <div style={{marginTop:'10px'}}>
          <label style={S.label}>Remark (optional)</label>
          <input value={form.Remark} onChange={e=>setForm(f=>({...f,Remark:e.target.value}))}
            placeholder="Additional note..." style={{...S.input}}/>
        </div>
      </div>

      <button onClick={()=>handleSubmit(type)} disabled={saving}
        style={{...(type==='Deduct'?S.btnRed:S.btn), opacity:saving?0.5:1, cursor:saving?'default':'pointer'}}>
        {saving ? 'Saving...' : type==='Deduct' ? `⬇ Deduct ${form.Points||'?'} Points` : `⬆ Award ${form.Points||'?'} Points`}
      </button>
    </div>
  );

  return (
    <div style={S.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}`}</style>

      {/* HEADER */}
      <div style={S.header}>
        <button onClick={()=>router.back()} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:'14px'}}>← Back</button>
        <div style={{textAlign:'center'}}>
          <p style={{fontWeight:900,fontSize:'13px',textTransform:'uppercase',letterSpacing:'0.1em',margin:0}}>House Points</p>
          <p style={{fontSize:'9px',color:'rgba(255,255,255,0.25)',textTransform:'uppercase',letterSpacing:'0.12em',margin:0}}>Shining Stars</p>
        </div>
        <button onClick={()=>fetchAll(user)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:'18px'}}>↻</button>
      </div>

      {/* TOAST */}
      {msg && (
        <div style={{position:'fixed',top:'64px',left:'50%',transform:'translateX(-50%)',zIndex:50,padding:'8px 20px',borderRadius:'999px',fontSize:'12px',fontWeight:900,color:'#fff',background:msg.type==='error'?'#ef4444':'#10b981',boxShadow:'0 4px 20px rgba(0,0,0,0.4)',whiteSpace:'nowrap'}}>
          {msg.text}
        </div>
      )}

      {/* TABS */}
      <div style={{display:'flex',gap:'6px',padding:'12px 16px 8px',overflowX:'auto'}}>
        {[
          {id:'award',       label:'⬆ Award'},
          {id:'deduct',      label:'⬇ Deduct'},
          {id:'leaderboard', label:'🏆 Leaderboard'},
          {id:'history',     label:'📋 My Records'},
        ].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={tab===t.id ? S.tabOn : S.tabOff}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{padding:'0 16px'}}>
        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:'60px 0'}}>
            <div style={{width:'32px',height:'32px',border:'3px solid rgba(255,255,255,0.1)',borderTop:'3px solid #fbbf24',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
          </div>
        ) : (
          <>
            {/* ── AWARD ── */}
            {tab==='award' && <FormContent type="Award"/>}

            {/* ── DEDUCT ── */}
            {tab==='deduct' && (
              <div>
                <div style={{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:'14px',padding:'12px 16px',marginTop:'8px',marginBottom:'4px'}}>
                  <p style={{color:'#f87171',fontSize:'11px',fontWeight:900,margin:0}}>⚠ Deduct သုံးရင် ကြောင်းကျိုး ပြည့်ပြည့်ဝဝ ဖြည့်ပါ — Record ထဲ မြင်ရပါမည်</p>
                </div>
                <FormContent type="Deduct"/>
              </div>
            )}

            {/* ── LEADERBOARD ── */}
            {tab==='leaderboard' && (
              <div style={{display:'flex',flexDirection:'column',gap:'10px',marginTop:'8px'}}>
                {leaderboard.length===0 ? (
                  <div style={{textAlign:'center',padding:'50px 0',color:'rgba(255,255,255,0.2)'}}>Points မရှိသေးပါ</div>
                ) : leaderboard.map((h,i)=>{
                  const col = houseColor(h.house);
                  return (
                    <div key={i} style={{background:col.bg,border:`1px solid ${col.border}`,borderRadius:'16px',padding:'16px',display:'flex',alignItems:'center',gap:'14px'}}>
                      <div style={{fontSize:'28px',flexShrink:0}}>{RANK_ICONS[i]||'⭐'}</div>
                      <div style={{flex:1}}>
                        <p style={{fontWeight:900,fontSize:'16px',color:col.text,margin:'0 0 2px'}}>{h.house}</p>
                        <div style={{height:'6px',background:'rgba(255,255,255,0.06)',borderRadius:'99px',overflow:'hidden',width:'100%'}}>
                          <div style={{height:'100%',width:`${Math.min(100,(h.total/(leaderboard[0]?.total||1))*100)}%`,background:col.text,borderRadius:'99px',transition:'width 0.8s ease'}}/>
                        </div>
                      </div>
                      <div style={{textAlign:'right',flexShrink:0}}>
                        <p style={{fontWeight:900,fontSize:'22px',color:col.text,margin:0}}>{h.total}</p>
                        <p style={{fontSize:'9px',color:'rgba(255,255,255,0.3)',margin:0}}>pts</p>
                      </div>
                    </div>
                  );
                })}

                {/* Category breakdown */}
                {points.length > 0 && (
                  <div style={{...S.card,marginTop:'4px'}}>
                    <p style={{...S.label,marginBottom:'12px'}}>Category Breakdown</p>
                    {categories.map(cat=>{
                      const total = points.filter(p=>p.Category===cat.name).reduce((s,p)=>s+Number(p.Points||0),0);
                      if(!total) return null;
                      return (
                        <div key={cat.name} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                          <span style={{color:'rgba(255,255,255,0.6)',fontSize:'12px'}}>{cat.name}</span>
                          <span style={{fontWeight:900,fontSize:'12px',color:total<0?'#f87171':'#34d399'}}>{total>0?'+':''}{total}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── HISTORY ── */}
            {tab==='history' && (
              <div style={{display:'flex',flexDirection:'column',gap:'8px',marginTop:'8px'}}>
                <p style={{fontSize:'10px',color:'rgba(255,255,255,0.3)',textAlign:'center',margin:'0 0 4px'}}>
                  ကိုယ်တိုင် record လုပ်ထားသော entries — {myHistory.length} ခု
                </p>
                {myHistory.length===0 ? (
                  <div style={{textAlign:'center',padding:'50px 0',color:'rgba(255,255,255,0.2)'}}>Record မရှိသေးပါ</div>
                ) : myHistory.map((p,i)=>{
                  const pts = Number(p.Points||0);
                  const col = houseColor(p.House_Name);
                  return (
                    <div key={i} style={{...S.card,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div style={{flex:1}}>
                        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'3px'}}>
                          <span style={{fontWeight:900,fontSize:'13px',color:'#fff'}}>{p.Name}</span>
                          <span style={{padding:'1px 8px',borderRadius:'99px',fontSize:'8px',fontWeight:900,background:col.bg,color:col.text}}>{p.House_Name}</span>
                        </div>
                        <p style={{fontSize:'9px',color:'rgba(255,255,255,0.3)',margin:0}}>{p.Category} · {p.Event_Name} · {p.Date}</p>
                        {p.Remark && <p style={{fontSize:'9px',color:'rgba(255,255,255,0.2)',fontStyle:'italic',margin:'2px 0 0'}}>{p.Remark}</p>}
                      </div>
                      <div style={{textAlign:'right',marginLeft:'12px',flexShrink:0}}>
                        <span style={{fontWeight:900,fontSize:'20px',color:pts<0?'#f87171':'#34d399'}}>
                          {pts>0?'+':''}{pts}
                        </span>
                        <p style={{fontSize:'9px',color:'rgba(255,255,255,0.25)',margin:0}}>pts</p>
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