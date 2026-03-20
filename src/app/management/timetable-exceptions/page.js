"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';
import { getTodayMM } from '@/lib/dateUtils';

// ── Styles ────────────────────────────────────────────────────
const S = {
  page:   { display:'flex', flexDirection:'column', minHeight:'100dvh', background:'#0F0E1A', color:'#E2E2F0', fontFamily:'system-ui,sans-serif' },
  header: { position:'sticky', top:0, zIndex:40, background:'rgba(15,14,26,0.97)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(158,158,202,0.2)', padding:'12px 16px', display:'flex', alignItems:'center', gap:'12px' },
  body:   { flex:1, overflowY:'auto', padding:'16px', paddingBottom:'80px', maxWidth:'860px', margin:'0 auto', width:'100%' },
  card:   { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px', padding:'16px', marginBottom:'14px' },
  input:  { width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'10px', padding:'10px 14px', color:'#fff', fontSize:'13px', outline:'none', boxSizing:'border-box' },
  select: { width:'100%', background:'#1A1830', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'10px', padding:'10px 14px', color:'#fff', fontSize:'13px', outline:'none', boxSizing:'border-box' },
  label:  { display:'block', fontSize:'9px', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:'5px', fontWeight:900 },
  btn:    { background:'#9E9ECA', color:'#0F0E1A', border:'none', borderRadius:'12px', padding:'11px 20px', fontSize:'12px', fontWeight:900, cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.06em' },
  btnSm:  { background:'rgba(158,158,202,0.15)', color:'#9E9ECA', border:'1px solid rgba(158,158,202,0.3)', borderRadius:'8px', padding:'6px 14px', fontSize:'10px', fontWeight:900, cursor:'pointer' },
  btnDel: { background:'rgba(239,68,68,0.15)', color:'#f87171', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'8px', padding:'5px 12px', fontSize:'10px', fontWeight:900, cursor:'pointer' },
  row:    { display:'flex', gap:'10px', marginBottom:'10px', flexWrap:'wrap' },
  badge:  { display:'inline-block', padding:'2px 8px', borderRadius:'20px', fontSize:'10px', fontWeight:900 },
  tab:    (active) => ({ border:'none', borderRadius:'20px', padding:'7px 16px', fontSize:'11px', fontWeight:900, cursor:'pointer', background: active?'#9E9ECA':'rgba(255,255,255,0.06)', color: active?'#0F0E1A':'rgba(255,255,255,0.4)' }),
};

const TYPE_COLOR  = { holiday:'#f87171', special:'#60a5fa', custom:'#a78bfa' };
const TYPE_LABEL  = { holiday:'🔴 Holiday', special:'🔵 Special', custom:'🟣 Custom' };

const gas = async (action, payload = {}) => {
  const r = await fetch(WEB_APP_URL, {
    method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'},
    body: JSON.stringify({ action, ...payload }),
  });
  return r.json();
};

const EMPTY_FORM = { Date:'', Class:'all', Type:'holiday', ScheduleOverride:'', Reason:'' };

export default function TimetableExceptionsPage() {
  const router = useRouter();
  const [user, setUser]             = useState(null);
  const [cfg,  setCfg]              = useState(null);   // timetable config
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving,  setSaving]        = useState(false);
  const [msg, setMsg]               = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  // Custom schedule editor
  const [customSlots, setCustomSlots] = useState({}); // { periodNo: {subject, teacher, room} }

  const showMsg = (text, type='ok') => { setMsg({text,type}); setTimeout(()=>setMsg(null),3000); };
  const f = (k,v) => setForm(p=>({...p,[k]:v}));

  // ── Load ──────────────────────────────────────────────────
  useEffect(()=>{
    const saved = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    if (u.userRole !== 'management') { router.push('/login'); return; }
    setUser(u);
    Promise.all([
      gas('getTimetableConfig'),
      gas('getExceptions',{}),
    ]).then(([cfgRes, excRes])=>{
      if (cfgRes.success) setCfg(cfgRes.config);
      if (excRes.success) setExceptions(excRes.data||[]);
    }).catch(()=>{}).finally(()=>setLoading(false));
  },[router]);

  const loadExceptions = async () => {
    try {
      const r = await gas('getExceptions',{});
      if (r.success) setExceptions(r.data||[]);
    } catch(e){}
  };

  // ── Derived data from config ───────────────────────────────
  const gradeKeys    = cfg ? Object.keys(cfg.grades||{}) : [];
  const classOptions = cfg ? [
    { value:'all', label:'📚 အတန်းအားလုံး (All Classes)' },
    ...gradeKeys.flatMap(g => {
      const secs = Array.isArray((cfg.grades||{})[g]) ? (cfg.grades||{})[g] : ['A'];
      if (secs.length <= 1) return [{ value:`Grade ${g}`, label:`Grade ${g}` }];
      return [
        { value:`Grade ${g}`, label:`Grade ${g} (အားလုံး)` },
        ...secs.map(s => ({ value:`Grade ${g}${s}`, label:`  └ Grade ${g} - ${s}` })),
      ];
    }),
  ] : [{ value:'all', label:'အတန်းအားလုံး' }];

  const periods  = cfg?.periods?.filter(p=>!p.isBreak) || [];
  const allPeriods = cfg?.periods || [];
  const subjects = cfg?.subjects || [];
  const dayNames = cfg?.days || ['Monday','Tuesday','Wednesday','Thursday','Friday'];

  // Special schedule options = existing day names (copy that day's schedule)
  const specialOptions = [
    ...dayNames.map(d => ({ value:`copy_${d}`, label:`📋 ${d} ၏ Schedule ကို ကူးသုံး` })),
    { value:'assembly', label:'🎪 Assembly Day' },
    { value:'exam',     label:'📝 Exam Day' },
    { value:'sports',   label:'🏃 Sports Day' },
    { value:'event',    label:'🎉 Event Day' },
  ];

  // Init custom slots when type changes to custom
  useEffect(()=>{
    if (form.Type !== 'custom') return;
    if (Object.keys(customSlots).length === 0 && periods.length > 0) {
      const init = {};
      periods.forEach(p => { init[p.no] = { subject:'', teacher:'', room:'' }; });
      setCustomSlots(init);
    }
  },[form.Type, periods]);

  // ── Save ──────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.Date || !form.Class || !form.Type) return showMsg('Date, Class, Type လိုအပ်သည်','err');
    if (form.Type==='special' && !form.ScheduleOverride) return showMsg('Special Schedule ရွေးပါ','err');
    setSaving(true);
    try {
      const override = form.Type==='custom'
        ? JSON.stringify(customSlots)
        : form.ScheduleOverride;
      const r = await gas('saveException', {
        ...form,
        ScheduleOverride: override,
        Created_By: user?.Name||user?.username||'management',
        userRole: 'management',
      });
      if (r.success) {
        showMsg('Exception သိမ်းပြီးပါပြီ ✓');
        setForm(EMPTY_FORM);
        setCustomSlots({});
        loadExceptions();
      } else showMsg(r.message||'Error','err');
    } catch(e){ showMsg('Network error','err'); }
    setSaving(false);
  };

  const handleDelete = async (exc) => {
    if (!confirm(`"${exc.Reason||exc.Date}" ဖျက်မှာ သေချာပါသလား?`)) return;
    try {
      const r = await gas('deleteException',{ Date:exc.Date, Class:exc.Class, userRole:'management' });
      if (r.success){ showMsg('ဖျက်ပြီးပါပြီ'); loadExceptions(); }
      else showMsg(r.message||'Error','err');
    } catch(e){ showMsg('Network error','err'); }
  };

  // Parse saved custom override for display
  const parseCustom = (str) => {
    try { return JSON.parse(str); } catch { return null; }
  };

  if (!user) return null;

  return (
    <div style={S.page}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div style={S.header}>
        <button onClick={()=>router.push('/management/mgt-dashboard')}
          style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:'18px',padding:'4px'}}>←</button>
        <div style={{fontSize:'14px',fontWeight:900,letterSpacing:'0.04em'}}>🗓️ Timetable Exceptions</div>
        {msg && <div style={{marginLeft:'auto',fontSize:'11px',fontWeight:700,color:msg.type==='err'?'#f87171':'#34d399'}}>{msg.text}</div>}
      </div>

      <div style={S.body}>

        {/* ── Add Form ──────────────────────────────────────── */}
        <div style={S.card}>
          <p style={{fontSize:'11px',fontWeight:900,color:'#9E9ECA',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'14px'}}>
            ချွင်းချက်ရက် အသစ်ထည့်ရန်
          </p>

          {/* Date + Class */}
          <div style={S.row}>
            <div style={{flex:1,minWidth:'140px'}}>
              <label style={S.label}>ရက်စွဲ *</label>
              <input type="date" value={form.Date} onChange={e=>f('Date',e.target.value)}
                style={S.input} min={getTodayMM()} />
            </div>
            <div style={{flex:2,minWidth:'180px'}}>
              <label style={S.label}>အတန်း / Class *</label>
              <select value={form.Class} onChange={e=>f('Class',e.target.value)} style={S.select}>
                {classOptions.map(o=>(
                  <option key={o.value} value={o.value} style={{background:'#1A1830'}}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Type tabs */}
          <div style={{marginBottom:'12px'}}>
            <label style={S.label}>ချွင်းချက် အမျိုးအစား *</label>
            <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
              {[
                {v:'holiday', icon:'🔴', label:'ကျောင်းပိတ်ရက်'},
                {v:'special', icon:'🔵', label:'Special Schedule'},
                {v:'custom',  icon:'🟣', label:'Custom Schedule'},
              ].map(t=>(
                <button key={t.v} onClick={()=>f('Type',t.v)} style={S.tab(form.Type===t.v)}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Special Schedule dropdown */}
          {form.Type==='special' && (
            <div style={{marginBottom:'12px',background:'rgba(96,165,250,0.06)',border:'1px solid rgba(96,165,250,0.2)',borderRadius:'12px',padding:'12px'}}>
              <label style={S.label}>Special Schedule ရွေးပါ</label>
              <select value={form.ScheduleOverride} onChange={e=>f('ScheduleOverride',e.target.value)} style={S.select}>
                <option value="" style={{background:'#1A1830'}}>— ရွေးပါ —</option>
                {specialOptions.map(o=>(
                  <option key={o.value} value={o.value} style={{background:'#1A1830'}}>{o.label}</option>
                ))}
              </select>
              {form.ScheduleOverride && (
                <p style={{fontSize:'10px',color:'rgba(96,165,250,0.6)',marginTop:'6px'}}>
                  {form.ScheduleOverride.startsWith('copy_')
                    ? `${form.ScheduleOverride.replace('copy_','')} ၏ timetable ကို ဤရက်တွင် သုံးမည်`
                    : `"${form.ScheduleOverride}" schedule ကို ဤရက်တွင် သုံးမည်`}
                </p>
              )}
            </div>
          )}

          {/* Custom Schedule editor */}
          {form.Type==='custom' && (
            <div style={{marginBottom:'12px',background:'rgba(167,139,250,0.06)',border:'1px solid rgba(167,139,250,0.2)',borderRadius:'12px',padding:'12px'}}>
              <p style={{fontSize:'11px',fontWeight:900,color:'#a78bfa',marginBottom:'12px'}}>
                🟣 ဤ ၁ ရက်အတွက်သာ စိတ်ကြိုက် Timetable သတ်မှတ်ပါ
              </p>

              {loading ? (
                <p style={{fontSize:'12px',color:'rgba(255,255,255,0.3)'}}>Config loading...</p>
              ) : allPeriods.length === 0 ? (
                <p style={{fontSize:'12px',color:'rgba(255,255,255,0.3)'}}>Timetable Config မရှိသေး</p>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                  {allPeriods.map(p=>{
                    const slot = customSlots[p.no] || {subject:'',teacher:'',room:''};
                    const setSlot = (k,v) => setCustomSlots(prev=>({...prev,[p.no]:{...slot,[k]:v}}));
                    return (
                      <div key={p.no} style={{
                        background: p.isBreak ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                        borderRadius:'10px', padding:'10px 12px',
                        border:'1px solid rgba(255,255,255,0.06)',
                        opacity: p.isBreak ? 0.5 : 1,
                      }}>
                        {/* Period header */}
                        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom: p.isBreak?0:8}}>
                          <span style={{
                            fontSize:'9px',fontWeight:900,
                            background: p.isBreak?'rgba(255,255,255,0.06)':'rgba(167,139,250,0.15)',
                            color: p.isBreak?'rgba(255,255,255,0.3)':'#a78bfa',
                            padding:'2px 8px',borderRadius:'20px',
                          }}>{p.label}</span>
                          <span style={{fontSize:'10px',color:'rgba(255,255,255,0.3)'}}>
                            {p.start} – {p.end}
                          </span>
                          {p.isBreak && <span style={{fontSize:'10px',color:'rgba(255,255,255,0.25)'}}>Break / Lunch</span>}
                        </div>

                        {/* Slot editor - only for non-break periods */}
                        {!p.isBreak && (
                          <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                            <div style={{flex:2,minWidth:'120px'}}>
                              <label style={{...S.label,marginBottom:'3px'}}>Subject</label>
                              <select value={slot.subject} onChange={e=>setSlot('subject',e.target.value)}
                                style={{...S.select,padding:'7px 10px',fontSize:'12px'}}>
                                <option value="" style={{background:'#1A1830'}}>— ဘာမှမရှိ / ပြောင်းမည် —</option>
                                {subjects.map(s=>(
                                  <option key={s} value={s} style={{background:'#1A1830'}}>{s}</option>
                                ))}
                                <option value="Assembly" style={{background:'#1A1830'}}>Assembly</option>
                                <option value="Free Period" style={{background:'#1A1830'}}>Free Period</option>
                                <option value="Study Hall" style={{background:'#1A1830'}}>Study Hall</option>
                              </select>
                            </div>
                            <div style={{flex:1,minWidth:'100px'}}>
                              <label style={{...S.label,marginBottom:'3px'}}>Teacher (optional)</label>
                              <input value={slot.teacher} onChange={e=>setSlot('teacher',e.target.value)}
                                placeholder="ဆရာ/ဆရာမ"
                                style={{...S.input,padding:'7px 10px',fontSize:'12px'}} />
                            </div>
                            <div style={{flex:1,minWidth:'80px'}}>
                              <label style={{...S.label,marginBottom:'3px'}}>Room (optional)</label>
                              <input value={slot.room} onChange={e=>setSlot('room',e.target.value)}
                                placeholder="ห้อง"
                                style={{...S.input,padding:'7px 10px',fontSize:'12px'}} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Reason */}
          <div style={{marginBottom:'14px'}}>
            <label style={S.label}>အကြောင်းပြချက်</label>
            <input value={form.Reason} onChange={e=>f('Reason',e.target.value)}
              placeholder="ဥပမာ ဝါဆိုလပြည့်၊ နိုင်ငံတော်ရုံးပိတ်ရက်"
              style={S.input} />
          </div>

          <button onClick={handleSave} disabled={saving} style={{...S.btn,opacity:saving?0.6:1}}>
            {saving ? 'သိမ်းနေသည်...' : '✓ Exception သိမ်းမည်'}
          </button>
        </div>

        {/* ── List ──────────────────────────────────────────── */}
        <div style={{fontSize:'10px',color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'8px',fontWeight:900}}>
          ရှိပြီးသား Exceptions ({exceptions.length})
        </div>

        {loading ? (
          <div style={{textAlign:'center',padding:'30px',color:'rgba(255,255,255,0.3)',fontSize:'13px'}}>Loading...</div>
        ) : exceptions.length === 0 ? (
          <div style={{...S.card,textAlign:'center',color:'rgba(255,255,255,0.3)',fontSize:'13px'}}>Exception မရှိသေး</div>
        ) : (
          exceptions.map((exc,i)=>{
            const tc = TYPE_COLOR[exc.Type]||'#9E9ECA';
            const tl = TYPE_LABEL[exc.Type]||exc.Type;
            const customData = exc.Type==='custom' ? parseCustom(exc.ScheduleOverride) : null;
            return (
              <div key={i} style={{...S.card,borderLeft:`3px solid ${tc}`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'6px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                    <span style={{fontSize:'14px',fontWeight:900}}>{exc.Date}</span>
                    <span style={{...S.badge,background:`${tc}22`,color:tc}}>{tl}</span>
                    <span style={{...S.badge,background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.5)'}}>
                      {exc.Class==='all'?'All Classes':exc.Class}
                    </span>
                  </div>
                  <button onClick={()=>handleDelete(exc)} style={S.btnDel}>ဖျက်</button>
                </div>

                {exc.Reason && <p style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',marginBottom:'4px'}}>📝 {exc.Reason}</p>}

                {/* Special schedule info */}
                {exc.Type==='special' && exc.ScheduleOverride && (
                  <div style={{fontSize:'10px',color:'rgba(96,165,250,0.7)',background:'rgba(96,165,250,0.08)',padding:'4px 10px',borderRadius:'8px',display:'inline-block'}}>
                    🔵 Schedule: {exc.ScheduleOverride.replace('copy_','')} 
                  </div>
                )}

                {/* Custom schedule preview */}
                {customData && (
                  <div style={{marginTop:'8px'}}>
                    <p style={{fontSize:'9px',fontWeight:900,color:'rgba(167,139,250,0.6)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'6px'}}>Custom Schedule</p>
                    <div style={{display:'flex',flexWrap:'wrap',gap:'4px'}}>
                      {Object.entries(customData).map(([no,slot])=>(
                        slot.subject ? (
                          <span key={no} style={{
                            fontSize:'10px',fontWeight:700,
                            background:'rgba(167,139,250,0.1)',color:'#a78bfa',
                            border:'1px solid rgba(167,139,250,0.2)',
                            borderRadius:'6px',padding:'3px 8px',
                          }}>
                            P{no}: {slot.subject}{slot.teacher?` · ${slot.teacher}`:''}
                          </span>
                        ) : null
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
