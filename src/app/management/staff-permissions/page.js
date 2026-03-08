"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

const PERMISSIONS = [
  { key:'Can_View_Student',           label:'View Students',       icon:'👨‍🎓', desc:'Student directory ကြည့်ခွင့်' },
  { key:'Can_View_Staff',             label:'View Staff',          icon:'👥', desc:'Staff directory ကြည့်ခွင့်' },
  { key:'Can_Manage_Fees',            label:'Manage Fees',         icon:'💰', desc:'Fees မှတ်တမ်းကြည့် / ပြင်ခွင့်' },
  { key:'Can_Manage_Hostel',          label:'Manage Hostel',       icon:'🏠', desc:'Hostel directory & inventory' },
  { key:'Can_Manage_Inventory',       label:'School Inventory',    icon:'📦', desc:'ကျောင်း inventory စီမံခန့်ခွဲခွင့်' },
  { key:'Can_Record_Note',            label:'Notes & Scores',      icon:'📝', desc:'Student notes / score မှတ်တမ်းတင်ခွင့်' },
  { key:'Can_Record_Points',          label:'House Points',        icon:'⭐', desc:'House points ထည့်ခွင့်' },
  { key:'Can_Record_Attendance_&_Leave',      label:'Attendance & Leave',  icon:'✅', desc:'Attendance / leave မှတ်ခွင့်' },
  { key:'Can_Post_Announcement',      label:'Announcements',       icon:'📢', desc:'Announcement တင်ခွင့်' },
  { key:'Can_Manage_Events',          label:'Events / Calendar',   icon:'📅', desc:'Events calendar ထည့်/ပြင်ခွင့်' },
];

const S = {
  page:   { minHeight:'100vh', background:'#0f172a', color:'#fff', fontFamily:'system-ui,sans-serif', paddingBottom:'80px' },
  header: { background:'#020617', borderBottom:'4px solid #fbbf24', padding:'14px 16px', display:'flex', alignItems:'center', gap:'12px' },
  card:   { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px', padding:'16px' },
  input:  { width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', padding:'10px 14px', color:'#fff', fontSize:'13px', outline:'none', boxSizing:'border-box' },
};

const toBool = v => v === true || v === 'true' || v === 'TRUE';

export default function StaffPermissionsPage() {
  const router = useRouter();
  const [user, setUser]         = useState(null);
  const [staff, setStaff]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState(null);
  const [perms, setPerms]       = useState({});
  const [status, setStatus]     = useState('TRUE');
  const [msg, setMsg]           = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    if (u.userRole !== 'management') { router.push('/login'); return; }
    setUser(u);
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'getStaffPermissions' }) });
      const r   = await res.json();
      if (r.success) setStaff(r.data || []);
    } catch {}
    setLoading(false);
  };

  const showMsg = (text, type='success') => { setMsg({text,type}); setTimeout(()=>setMsg(null), 3500); };

  const selectStaff = s => {
    setSelected(s);
    const p = {};
    PERMISSIONS.forEach(({ key }) => { p[key] = toBool(s[key]); });
    setPerms(p);
    setStatus((s.Status || 'TRUE').toString().toUpperCase() === 'FALSE' ? 'FALSE' : 'TRUE');
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({
        action:      'updateStaffPermissions',
        Staff_ID:    selected.Staff_ID,
        Name:        selected.Name,
        permissions: perms,
        Status:      status,
      }) });
      const r = await res.json();
      if (r.success) {
        showMsg('Permission update ပြီးပါပြီ ✓');
        // Update local state
        setStaff(prev => prev.map(s =>
          (s.Staff_ID || s.Username) === (selected.Staff_ID)
            ? { ...s, ...perms, Status: status }
            : s
        ));
        setSelected(prev => ({ ...prev, ...perms, Status: status }));
      } else showMsg(r.message || 'Error', 'error');
    } catch { showMsg('Network error', 'error'); }
    setSaving(false);
  };

  const toggleAll = (val) => {
    const p = {};
    PERMISSIONS.forEach(({ key }) => { p[key] = val; });
    setPerms(p);
  };

  const filtered = staff.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (s.Name||'').toLowerCase().includes(q) || (s.Staff_ID||'').toString().toLowerCase().includes(q);
  });

  const permCount = s => PERMISSIONS.filter(({ key }) => toBool(s[key])).length;

  return (
    <div style={S.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}`}</style>

      {/* Header */}
      <div style={S.header}>
        <button onClick={() => router.push('/management/mgt-dashboard')} style={{ background:'rgba(255,255,255,0.08)', border:'none', color:'rgba(255,255,255,0.6)', borderRadius:'10px', width:'36px', height:'36px', cursor:'pointer', fontSize:'16px' }}>←</button>
        <div>
          <p style={{ fontWeight:900, fontSize:'14px', color:'#fff', margin:0, textTransform:'uppercase', letterSpacing:'0.05em' }}>🔐 Staff Permissions</p>
          <p style={{ fontSize:'9px', color:'#fbbf24', margin:0, letterSpacing:'0.15em', textTransform:'uppercase' }}>Management Panel</p>
        </div>
      </div>

      {/* Toast */}
      {msg && (
        <div style={{ position:'fixed', top:'68px', left:'50%', transform:'translateX(-50%)', zIndex:60, padding:'8px 20px', borderRadius:'999px', fontSize:'12px', fontWeight:900, color:'#fff', background: msg.type==='error'?'#ef4444':'#10b981', boxShadow:'0 4px 20px rgba(0,0,0,0.4)', whiteSpace:'nowrap' }}>
          {msg.text}
        </div>
      )}

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'80px 0' }}>
          <div style={{ width:'32px', height:'32px', border:'3px solid rgba(255,255,255,0.1)', borderTop:'3px solid #fbbf24', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <div style={{ maxWidth:'600px', margin:'0 auto', padding:'16px', display:'flex', flexDirection:'column', gap:'12px' }}>

          {/* Staff list OR permission editor */}
          {!selected ? (
            <>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="🔍 Staff ရှာပါ..." style={S.input} />
              <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.25)', margin:0 }}>{filtered.length} staff members</p>

              {filtered.map((s, i) => {
                const active  = (s.Status||'TRUE').toString().toUpperCase() !== 'FALSE';
                const pCount  = permCount(s);
                return (
                  <button key={i} onClick={() => selectStaff(s)}
                    style={{ ...S.card, cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', textAlign:'left', border:`1px solid ${active?'rgba(255,255,255,0.08)':'rgba(248,113,113,0.2)'}`, width:'100%', background: active?'rgba(255,255,255,0.04)':'rgba(248,113,113,0.04)' }}>
                    <div>
                      <p style={{ fontWeight:900, fontSize:'13px', color: active?'#fff':'rgba(255,255,255,0.4)', margin:'0 0 4px' }}>{s.Name}</p>
                      <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.3)', margin:0 }}>
                        ID: {s.Staff_ID}
                        {!active && <span style={{ marginLeft:'8px', color:'#f87171', fontWeight:900 }}>INACTIVE</span>}
                      </p>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      {/* Permission dots */}
                      <div style={{ display:'flex', gap:'3px', justifyContent:'flex-end', marginBottom:'4px' }}>
                        {PERMISSIONS.map(({ key, icon }) => (
                          <span key={key} style={{ fontSize:'10px', opacity: toBool(s[key]) ? 1 : 0.15 }}>{icon}</span>
                        ))}
                      </div>
                      <p style={{ fontSize:'8px', color:'rgba(255,255,255,0.25)', margin:0 }}>
                        {pCount}/{PERMISSIONS.length} permissions
                      </p>
                    </div>
                  </button>
                );
              })}
            </>
          ) : (
            <>
              {/* Back + staff name */}
              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <button onClick={() => setSelected(null)}
                  style={{ background:'rgba(255,255,255,0.08)', border:'none', color:'rgba(255,255,255,0.6)', borderRadius:'10px', padding:'8px 14px', cursor:'pointer', fontSize:'12px', fontWeight:900 }}>← Back</button>
                <div>
                  <p style={{ fontWeight:900, fontSize:'15px', color:'#fff', margin:0 }}>{selected.Name}</p>
                  <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.3)', margin:0 }}>ID: {selected.Staff_ID}</p>
                </div>
              </div>

              {/* Account status */}
              <div style={S.card}>
                <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:900, marginBottom:'10px' }}>Account Status</p>
                <div style={{ display:'flex', gap:'8px' }}>
                  {['TRUE','FALSE'].map(v => (
                    <button key={v} onClick={() => setStatus(v)}
                      style={{ flex:1, padding:'10px', borderRadius:'12px', border:'none', cursor:'pointer', fontWeight:900, fontSize:'11px', textTransform:'uppercase',
                        background: status===v ? (v==='TRUE'?'#10b981':'#ef4444') : 'rgba(255,255,255,0.06)',
                        color: status===v ? '#fff' : 'rgba(255,255,255,0.35)' }}>
                      {v === 'TRUE' ? '✓ Active' : '✕ Inactive'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Permissions */}
              <div style={S.card}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                  <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:900, margin:0 }}>Permissions</p>
                  <div style={{ display:'flex', gap:'8px' }}>
                    <button onClick={() => toggleAll(true)}
                      style={{ background:'rgba(52,211,153,0.1)', border:'1px solid rgba(52,211,153,0.2)', color:'#34d399', borderRadius:'8px', padding:'4px 10px', fontSize:'9px', fontWeight:900, cursor:'pointer' }}>All ON</button>
                    <button onClick={() => toggleAll(false)}
                      style={{ background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.2)', color:'#f87171', borderRadius:'8px', padding:'4px 10px', fontSize:'9px', fontWeight:900, cursor:'pointer' }}>All OFF</button>
                  </div>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {PERMISSIONS.map(({ key, label, icon, desc }) => (
                    <div key={key}
                      style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderRadius:'12px', cursor:'pointer',
                        background: perms[key] ? 'rgba(251,191,36,0.07)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${perms[key] ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.06)'}` }}
                      onClick={() => setPerms(p => ({ ...p, [key]: !p[key] }))}>
                      <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                        <span style={{ fontSize:'20px', opacity: perms[key] ? 1 : 0.3 }}>{icon}</span>
                        <div>
                          <p style={{ fontWeight:900, fontSize:'12px', color: perms[key] ? '#fff' : 'rgba(255,255,255,0.4)', margin:0 }}>{label}</p>
                          <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.25)', margin:0 }}>{desc}</p>
                        </div>
                      </div>
                      {/* Toggle */}
                      <div style={{ width:'44px', height:'24px', borderRadius:'12px', position:'relative', flexShrink:0, cursor:'pointer',
                        background: perms[key] ? '#fbbf24' : 'rgba(255,255,255,0.1)', transition:'background 0.2s' }}>
                        <div style={{ position:'absolute', top:'3px', width:'18px', height:'18px', borderRadius:'50%', background:'#fff',
                          transition:'left 0.2s', left: perms[key] ? '23px' : '3px',
                          boxShadow:'0 1px 4px rgba(0,0,0,0.4)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div style={{ background:'rgba(251,191,36,0.05)', border:'1px solid rgba(251,191,36,0.15)', borderRadius:'12px', padding:'12px 16px' }}>
                <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.5)', margin:'0 0 6px', fontWeight:900 }}>Summary</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                  {PERMISSIONS.filter(({ key }) => perms[key]).map(({ icon, label }) => (
                    <span key={label} style={{ fontSize:'10px', fontWeight:900, padding:'3px 10px', borderRadius:'99px', background:'rgba(251,191,36,0.12)', color:'#fbbf24' }}>
                      {icon} {label}
                    </span>
                  ))}
                  {Object.values(perms).every(v => !v) && (
                    <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)', fontStyle:'italic' }}>Permission မရှိပါ</span>
                  )}
                </div>
              </div>

              <button onClick={handleSave} disabled={saving}
                style={{ background:'#fbbf24', color:'#020617', border:'none', borderRadius:'14px', padding:'14px', fontSize:'13px', fontWeight:900, width:'100%', cursor: saving?'default':'pointer', textTransform:'uppercase', letterSpacing:'0.06em', opacity: saving?0.5:1 }}>
                {saving ? 'Saving...' : '💾 Save Permissions'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}