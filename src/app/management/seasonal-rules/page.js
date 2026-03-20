"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

const S = {
  page:   { display:'flex', flexDirection:'column', minHeight:'100dvh', background:'#0F0E1A', color:'#E2E2F0', fontFamily:'system-ui,sans-serif' },
  header: { position:'sticky', top:0, zIndex:40, background:'rgba(15,14,26,0.97)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(158,158,202,0.2)', padding:'12px 16px', display:'flex', alignItems:'center', gap:'12px' },
  body:   { flex:1, overflowY:'auto', padding:'16px', paddingBottom:'80px', maxWidth:'800px', margin:'0 auto', width:'100%' },
  card:   { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px', padding:'16px', marginBottom:'14px' },
  input:  { width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'10px', padding:'10px 14px', color:'#fff', fontSize:'13px', outline:'none', boxSizing:'border-box' },
  label:  { display:'block', fontSize:'9px', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:'5px', fontWeight:900 },
  btn:    { background:'#9E9ECA', color:'#0F0E1A', border:'none', borderRadius:'12px', padding:'11px 20px', fontSize:'12px', fontWeight:900, cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.06em' },
  btnDel: { background:'rgba(239,68,68,0.15)', color:'#f87171', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'8px', padding:'5px 12px', fontSize:'10px', fontWeight:900, cursor:'pointer' },
  row:    { display:'flex', gap:'10px', marginBottom:'10px' },
  toggle: { display:'flex', alignItems:'center', gap:'8px', cursor:'pointer' },
};

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const gas = async (action, payload = {}) => {
  const res = await fetch(WEB_APP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...payload }),
  });
  return res.json();
};

const EMPTY = { Name:'', StartDate:'', EndDate:'', ApplyToAll:true };

export default function SeasonalRulesPage() {
  const router = useRouter();
  const [user, setUser]   = useState(null);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState(null);
  const [form, setForm]       = useState(EMPTY);
  // day overrides: { Sunday: 'closed', Monday: 'open', ... }
  const [dayOverrides, setDayOverrides] = useState({ Sunday:'closed', Saturday:'closed' });

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
    loadRules();
  }, [router]);

  const loadRules = async () => {
    setLoading(true);
    try {
      const r = await gas('getSeasonalRules');
      if (r.success) setRules(r.data || []);
    } catch(e) {}
    setLoading(false);
  };

  const toggleDay = (day) => {
    setDayOverrides(prev => ({
      ...prev,
      [day]: prev[day] === 'closed' ? 'open' : 'closed',
    }));
  };

  const handleSave = async () => {
    if (!form.Name || !form.StartDate || !form.EndDate) return showMsg('Name, StartDate, EndDate လိုအပ်သည်', 'err');
    setSaving(true);
    try {
      const r = await gas('saveSeasonalRule', {
        Name: form.Name,
        StartDate: form.StartDate,
        EndDate: form.EndDate,
        ApplyToAll: form.ApplyToAll,
        OverrideDays: JSON.stringify(dayOverrides),
        Created_By: user?.Name || user?.username || 'management',
        userRole: 'management',
      });
      if (r.success) {
        showMsg('Seasonal Rule သိမ်းပြီးပါပြီ ✓');
        setForm(EMPTY);
        setDayOverrides({ Sunday:'closed', Saturday:'closed' });
        loadRules();
      } else showMsg(r.message || 'Error', 'err');
    } catch(e) { showMsg('Network error', 'err'); }
    setSaving(false);
  };

  const handleDelete = async (name) => {
    if (!confirm(`"${name}" ဖျက်မှာ သေချာပါသလား?`)) return;
    try {
      const r = await gas('deleteSeasonalRule', { Name: name, userRole:'management' });
      if (r.success) { showMsg('ဖျက်ပြီးပါပြီ'); loadRules(); }
      else showMsg(r.message || 'Error', 'err');
    } catch(e) { showMsg('Network error', 'err'); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const parseDays = (str) => {
    try { return JSON.parse(str || '{}'); } catch { return {}; }
  };

  if (!user) return null;

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <button onClick={() => router.push('/management/mgt-dashboard')}
          style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:'18px', padding:'4px' }}>←</button>
        <div style={{ fontSize:'14px', fontWeight:900, letterSpacing:'0.04em' }}>🌤️ Seasonal Rules</div>
        {msg && (
          <div style={{ marginLeft:'auto', fontSize:'11px', fontWeight:700,
            color: msg.type==='err' ? '#f87171' : '#34d399' }}>
            {msg.text}
          </div>
        )}
      </div>

      <div style={S.body}>
        {/* Help text */}
        <div style={{ ...S.card, background:'rgba(158,158,202,0.08)', border:'1px solid rgba(158,158,202,0.2)', marginBottom:'16px' }}>
          <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.5)', lineHeight:1.6, margin:0 }}>
            <strong style={{ color:'#9E9ECA' }}>Seasonal Rules</strong> — ကျောင်းနှစ်အတွင်း ကာလများ (ဥပမာ ဝါတွင်းကာလ) အတွက် ပုံမှန် schedule ပြောင်းလဲချင်ရင် သတ်မှတ်ပါ။
            ဥပမာ ဝါတွင်းကာလတွင် တနင်္ဂနွေပိတ်၊ စနေနေ့ပွင့်လည်ပတ်မည်။
          </p>
        </div>

        {/* Add Form */}
        <div style={S.card}>
          <p style={{ fontSize:'11px', fontWeight:900, color:'#9E9ECA', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'14px' }}>
            Seasonal Rule အသစ်ထည့်ရန်
          </p>

          <div style={{ marginBottom:'10px' }}>
            <label style={S.label}>Rule အမည် *</label>
            <input value={form.Name} onChange={e => f('Name', e.target.value)}
              placeholder="ဥပမာ ဝါတွင်းကာလ ၂၀၂၅"
              style={S.input} />
          </div>

          <div style={S.row}>
            <div style={{ flex:1 }}>
              <label style={S.label}>စတင်ရက် *</label>
              <input type="date" value={form.StartDate} onChange={e => f('StartDate', e.target.value)} style={S.input} />
            </div>
            <div style={{ flex:1 }}>
              <label style={S.label}>ပြီးဆုံးရက် *</label>
              <input type="date" value={form.EndDate} onChange={e => f('EndDate', e.target.value)} style={S.input} />
            </div>
          </div>

          {/* Day toggles */}
          <div style={{ marginBottom:'14px' }}>
            <label style={S.label}>ရက်သတ္တပတ်အလိုက် ပိတ်/ဖွင့် သတ်မှတ်ရန်</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginTop:'6px' }}>
              {DAYS.map(day => {
                const isClosed = dayOverrides[day] === 'closed';
                return (
                  <button key={day} onClick={() => toggleDay(day)} style={{
                    background: isClosed ? 'rgba(239,68,68,0.15)' : 'rgba(52,211,153,0.15)',
                    color: isClosed ? '#f87171' : '#34d399',
                    border: `1px solid ${isClosed ? 'rgba(239,68,68,0.3)' : 'rgba(52,211,153,0.3)'}`,
                    borderRadius:'20px', padding:'5px 12px', fontSize:'11px', fontWeight:900, cursor:'pointer',
                  }}>
                    {day.slice(0,3)} {isClosed ? '🔴' : '🟢'}
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)', marginTop:'6px' }}>
              🔴 = ပိတ်ရက်  🟢 = ဖွင့်ရက် — နှိပ်၍ ပြောင်းနိုင်သည်
            </p>
          </div>

          <button onClick={handleSave} disabled={saving} style={{ ...S.btn, opacity: saving ? 0.6 : 1 }}>
            {saving ? 'သိမ်းနေသည်...' : '✓ Rule သိမ်းမည်'}
          </button>
        </div>

        {/* List */}
        <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'8px', fontWeight:900 }}>
          ရှိပြီးသား Rules ({rules.length})
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'30px', color:'rgba(255,255,255,0.3)', fontSize:'13px' }}>Loading...</div>
        ) : rules.length === 0 ? (
          <div style={{ ...S.card, textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:'13px' }}>
            Seasonal Rule မရှိသေး
          </div>
        ) : (
          rules.map((rule, i) => {
            const days = parseDays(rule.OverrideDays);
            return (
              <div key={i} style={S.card}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px' }}>
                  <div style={{ fontWeight:900, fontSize:'14px' }}>{rule.Name}</div>
                  <button onClick={() => handleDelete(rule.Name)} style={S.btnDel}>ဖျက်</button>
                </div>
                <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.45)', marginBottom:'8px' }}>
                  {rule.StartDate} → {rule.EndDate}
                  {rule.ApplyToAll === 'TRUE' && <span style={{ marginLeft:'8px', color:'#9E9ECA' }}>· အတန်းအားလုံး</span>}
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                  {DAYS.map(day => {
                    const status = days[day];
                    if (!status) return null;
                    return (
                      <span key={day} style={{
                        background: status==='closed' ? 'rgba(239,68,68,0.12)' : 'rgba(52,211,153,0.12)',
                        color: status==='closed' ? '#f87171' : '#34d399',
                        border: `1px solid ${status==='closed' ? 'rgba(239,68,68,0.25)' : 'rgba(52,211,153,0.25)'}`,
                        borderRadius:'20px', padding:'2px 10px', fontSize:'10px', fontWeight:700,
                      }}>
                        {day.slice(0,3)} {status==='closed'?'🔴':'🟢'}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
