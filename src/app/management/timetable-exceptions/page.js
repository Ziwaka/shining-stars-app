"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';
import { getTodayMM } from '@/lib/dateUtils';

const S = {
  page:   { display:'flex', flexDirection:'column', minHeight:'100dvh', background:'#0F0E1A', color:'#E2E2F0', fontFamily:'system-ui,sans-serif' },
  header: { position:'sticky', top:0, zIndex:40, background:'rgba(15,14,26,0.97)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(158,158,202,0.2)', padding:'12px 16px', display:'flex', alignItems:'center', gap:'12px' },
  body:   { flex:1, overflowY:'auto', padding:'16px', paddingBottom:'80px', maxWidth:'800px', margin:'0 auto', width:'100%' },
  card:   { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px', padding:'16px', marginBottom:'14px' },
  input:  { width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'10px', padding:'10px 14px', color:'#fff', fontSize:'13px', outline:'none', boxSizing:'border-box' },
  select: { width:'100%', background:'#1A1830', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'10px', padding:'10px 14px', color:'#fff', fontSize:'13px', outline:'none', boxSizing:'border-box' },
  label:  { display:'block', fontSize:'9px', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:'5px', fontWeight:900 },
  btn:    { background:'#9E9ECA', color:'#0F0E1A', border:'none', borderRadius:'12px', padding:'11px 20px', fontSize:'12px', fontWeight:900, cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.06em' },
  btnDel: { background:'rgba(239,68,68,0.15)', color:'#f87171', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'8px', padding:'5px 12px', fontSize:'10px', fontWeight:900, cursor:'pointer' },
  row:    { display:'flex', gap:'10px', marginBottom:'10px' },
  badge:  { display:'inline-block', padding:'2px 8px', borderRadius:'20px', fontSize:'10px', fontWeight:900 },
};

const gas = async (action, payload = {}) => {
  const res = await fetch(WEB_APP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...payload }),
  });
  return res.json();
};

const EMPTY = { Date:'', Class:'all', Type:'holiday', ScheduleOverride:'', Reason:'' };

export default function TimetableExceptionsPage() {
  const router = useRouter();
  const [user, setUser]           = useState(null);
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState(null);
  const [form, setForm]           = useState(EMPTY);

  const showMsg = (text, type = 'ok') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  };

  useEffect(() => {
    const saved = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    if (u.userRole !== 'management') { router.push('/login'); return; }
    setUser(u);
    loadExceptions();
  }, [router]);

  const loadExceptions = async () => {
    setLoading(true);
    try {
      const r = await gas('getExceptions', {});
      if (r.success) setExceptions(r.data || []);
    } catch(e) {}
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.Date || !form.Class || !form.Type) return showMsg('Date, Class, Type လိုအပ်သည်', 'err');
    setSaving(true);
    try {
      const r = await gas('saveException', {
        ...form,
        Created_By: user?.Name || user?.username || 'management',
        userRole: 'management',
      });
      if (r.success) {
        showMsg('Exception သိမ်းပြီးပါပြီ ✓');
        setForm(EMPTY);
        loadExceptions();
      } else showMsg(r.message || 'Error', 'err');
    } catch(e) { showMsg('Network error', 'err'); }
    setSaving(false);
  };

  const handleDelete = async (exc) => {
    if (!confirm(`"${exc.Reason || exc.Date}" ဖျက်မှာ သေချာပါသလား?`)) return;
    try {
      const r = await gas('deleteException', { Date: exc.Date, Class: exc.Class, userRole:'management' });
      if (r.success) { showMsg('ဖျက်ပြီးပါပြီ'); loadExceptions(); }
      else showMsg(r.message || 'Error', 'err');
    } catch(e) { showMsg('Network error', 'err'); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const TYPE_COLOR = { holiday: '#f87171', special: '#60a5fa' };

  if (!user) return null;

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <button onClick={() => router.push('/management/mgt-dashboard')}
          style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:'18px', padding:'4px' }}>←</button>
        <div style={{ fontSize:'14px', fontWeight:900, letterSpacing:'0.04em' }}>🗓️ Timetable Exceptions</div>
        {msg && (
          <div style={{ marginLeft:'auto', fontSize:'11px', fontWeight:700,
            color: msg.type==='err' ? '#f87171' : '#34d399' }}>
            {msg.text}
          </div>
        )}
      </div>

      <div style={S.body}>
        {/* Add Form */}
        <div style={S.card}>
          <p style={{ fontSize:'11px', fontWeight:900, color:'#9E9ECA', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'14px' }}>
            ချွင်းချက်ရက် အသစ်ထည့်ရန်
          </p>

          <div style={S.row}>
            <div style={{ flex:1 }}>
              <label style={S.label}>ရက်စွဲ *</label>
              <input type="date" value={form.Date} onChange={e => f('Date', e.target.value)}
                style={S.input} min={getTodayMM()} />
            </div>
            <div style={{ flex:1 }}>
              <label style={S.label}>အတန်း / Class</label>
              <input value={form.Class} onChange={e => f('Class', e.target.value)}
                placeholder="all  (သို့)  Grade 5  (သို့)  5A"
                style={S.input} />
            </div>
          </div>

          <div style={{ marginBottom:'10px' }}>
            <label style={S.label}>အမျိုးအစား *</label>
            <select value={form.Type} onChange={e => f('Type', e.target.value)} style={S.select}>
              <option value="holiday">🔴 ကျောင်းပိတ်ရက် (Holiday)</option>
              <option value="special">🔵 အထူးအချိန်ဇယား (Special Schedule)</option>
            </select>
          </div>

          {form.Type === 'special' && (
            <div style={{ marginBottom:'10px' }}>
              <label style={S.label}>Schedule Override ID</label>
              <input value={form.ScheduleOverride} onChange={e => f('ScheduleOverride', e.target.value)}
                placeholder="ဥပမာ saturday_schedule"
                style={S.input} />
            </div>
          )}

          <div style={{ marginBottom:'14px' }}>
            <label style={S.label}>အကြောင်းပြချက်</label>
            <input value={form.Reason} onChange={e => f('Reason', e.target.value)}
              placeholder="ဥပမာ ဝါဆိုလပြည့်၊ နိုင်ငံတော်ရုံးပိတ်ရက်"
              style={S.input} />
          </div>

          <button onClick={handleSave} disabled={saving} style={{ ...S.btn, opacity: saving ? 0.6 : 1 }}>
            {saving ? 'သိမ်းနေသည်...' : '✓ Exception သိမ်းမည်'}
          </button>
        </div>

        {/* List */}
        <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'8px', fontWeight:900 }}>
          ရှိပြီးသား Exceptions ({exceptions.length})
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'30px', color:'rgba(255,255,255,0.3)', fontSize:'13px' }}>Loading...</div>
        ) : exceptions.length === 0 ? (
          <div style={{ ...S.card, textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:'13px' }}>
            Exception မရှိသေး
          </div>
        ) : (
          exceptions.map((exc, i) => (
            <div key={i} style={S.card}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
                    <span style={{ fontSize:'14px', fontWeight:900 }}>{exc.Date}</span>
                    <span style={{ ...S.badge, background: exc.Type==='holiday' ? 'rgba(248,113,113,0.15)' : 'rgba(96,165,250,0.15)', color: TYPE_COLOR[exc.Type] || '#9E9ECA' }}>
                      {exc.Type === 'holiday' ? '🔴 Holiday' : '🔵 Special'}
                    </span>
                  </div>
                  <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.5)' }}>
                    Class: <span style={{ color:'#9E9ECA' }}>{exc.Class}</span>
                    {exc.Reason && <> · {exc.Reason}</>}
                    {exc.ScheduleOverride && <> · Schedule: {exc.ScheduleOverride}</>}
                  </div>
                </div>
                <button onClick={() => handleDelete(exc)} style={S.btnDel}>ဖျက်</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
