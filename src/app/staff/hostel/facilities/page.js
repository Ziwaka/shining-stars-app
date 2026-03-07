"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

const CATEGORIES = ['Furniture','Bedding','Electronics','Cleaning','Kitchen','Bathroom','Sports','Other'];
const UNITS      = ['Pcs','Set','Box','Roll','Bottle','Pack','Kg','Liter'];
const EMPTY_FORM = {
  Hostel_Name:'', Item_Name:'', Category:'Furniture', Unit:'Pcs',
  Stock_Qty:'', Min_Stock:'2', Good_Condition:'', Damaged:'0', Need_Repair:'0',
  Unit_Price:'', Location:'', Serial_No:'', Purchase_Date:'', Note:'', Photo_URL:''
};

const S = {
  page:   { minHeight:'100vh', background:'#0f0a1e', color:'#fff', fontFamily:'system-ui,sans-serif', paddingBottom:'80px' },
  header: { position:'sticky', top:0, zIndex:40, background:'rgba(15,10,30,0.97)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,0.07)', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' },
  card:   { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'16px', padding:'16px' },
  input:  { width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'12px', padding:'10px 14px', color:'#fff', fontSize:'13px', outline:'none', boxSizing:'border-box' },
  select: { width:'100%', background:'rgba(15,10,30,0.9)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'12px', padding:'10px 14px', color:'#fff', fontSize:'13px', outline:'none', boxSizing:'border-box' },
  label:  { display:'block', fontSize:'9px', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'6px' },
  btn:    { background:'#fbbf24', color:'#0f172a', border:'none', borderRadius:'14px', padding:'13px', fontSize:'13px', fontWeight:900, width:'100%', cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.06em' },
  btnSm:  { background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.5)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'6px 12px', fontSize:'10px', fontWeight:900, cursor:'pointer', flex:1, textAlign:'center' },
  tabOn:  { background:'#fbbf24', color:'#0f172a', border:'none', borderRadius:'10px', padding:'7px 14px', fontSize:'10px', fontWeight:900, textTransform:'uppercase', cursor:'pointer', whiteSpace:'nowrap' },
  tabOff: { background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.4)', border:'none', borderRadius:'10px', padding:'7px 14px', fontSize:'10px', fontWeight:900, textTransform:'uppercase', cursor:'pointer', whiteSpace:'nowrap' },
};

export default function HostelInventoryPage() {
  const router = useRouter();
  const [user, setUser]           = useState(null);
  const [items, setItems]         = useState([]);
  const [logs, setLogs]           = useState([]);
  const [hostels, setHostels]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [tab, setTab]             = useState('dashboard');
  const [search, setSearch]       = useState('');
  const [hostelFilter, setHostelFilter] = useState('All');
  const [catFilter, setCatFilter]       = useState('All');
  const [form, setForm]           = useState(EMPTY_FORM);
  const [editItem, setEditItem]   = useState(null);
  const [usageModal, setUsageModal] = useState(null);
  const [usageForm, setUsageForm]   = useState({ qty:'', action:'Use', good:'', damaged:'', need_repair:'', note:'' });
  const [msg, setMsg]             = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    if (!u.Can_Manage_Hostel && u.userRole !== 'management') { router.push('/staff'); return; }
    setUser(u);
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [invRes, logRes] = await Promise.all([
        fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'getHostelInventory' }) }),
        fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'getHostelInventoryLog' }) }),
      ]);
      const inv = await invRes.json();
      const log = await logRes.json();
      if (inv.success) {
        setItems(inv.data || []);
        const hs = inv.hostels || [];
        setHostels(hs);
        if (hs.length) setForm(f => ({ ...f, Hostel_Name: f.Hostel_Name || hs[0] }));
      }
      if (log.success) setLogs(log.data || []);
    } catch {}
    setLoading(false);
  };

  const showMsg = (text, type='success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3500);
  };

  const filtered = items.filter(i => {
    const s = search.toLowerCase();
    return (!search || (i.Item_Name||'').toLowerCase().includes(s) || (i.Location||'').toLowerCase().includes(s))
      && (hostelFilter === 'All' || i.Hostel_Name === hostelFilter)
      && (catFilter    === 'All' || i.Category    === catFilter);
  });

  const lowStock   = items.filter(i => Number(i.Stock_Qty||0) <= Number(i.Min_Stock||0) && Number(i.Min_Stock||0) > 0);
  const needRepair = items.filter(i => Number(i.Need_Repair||0) > 0);

  const byHostel = items.reduce((acc, i) => {
    const h = i.Hostel_Name || 'Unknown';
    if (!acc[h]) acc[h] = { items:[] };
    acc[h].items.push(i);
    return acc;
  }, {});

  const handleSave = async () => {
    if (!form.Item_Name.trim() || !form.Hostel_Name) return showMsg('Item Name နှင့် Hostel ဖြည့်ပါ', 'error');
    setSaving(true);
    try {
      const action  = editItem ? 'updateHostelItem' : 'addHostelItem';
      const payload = { ...form, Updated_By: user?.Name || '' };
      if (editItem) payload.Item_ID = editItem.Item_ID;
      const r = await (await fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action, ...payload }) })).json();
      if (r.success) {
        showMsg(r.message);
        setForm({ ...EMPTY_FORM, Hostel_Name: form.Hostel_Name });
        setEditItem(null); setTab('list'); fetchAll();
      } else showMsg(r.message || 'Error', 'error');
    } catch { showMsg('Network error', 'error'); }
    setSaving(false);
  };

  const handleUsage = async () => {
    if (usageForm.action !== 'Condition Check' && (!usageForm.qty || isNaN(Number(usageForm.qty))))
      return showMsg('Qty ထည့်ပါ', 'error');
    setSaving(true);
    const qtyChange = usageForm.action === 'Restock' ? Math.abs(Number(usageForm.qty||0)) : -Math.abs(Number(usageForm.qty||0));
    try {
      const payload = {
        action:      'logHostelUsage',
        Item_ID:     usageModal.Item_ID,
        Item_Name:   usageModal.Item_Name,
        Hostel_Name: usageModal.Hostel_Name,
        Qty_Change:  usageForm.action === 'Condition Check' ? 0 : qtyChange,
        Action:      usageForm.action,
        Done_By:     user?.Name || '',
        Note:        usageForm.note,
      };
      if (usageForm.good       !== '') payload.Good_Condition = usageForm.good;
      if (usageForm.damaged    !== '') payload.Damaged        = usageForm.damaged;
      if (usageForm.need_repair!== '') payload.Need_Repair    = usageForm.need_repair;
      const r = await (await fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify(payload) })).json();
      if (r.success) {
        showMsg(r.message); setUsageModal(null);
        setUsageForm({ qty:'', action:'Use', good:'', damaged:'', need_repair:'', note:'' });
        fetchAll();
      } else showMsg(r.message || 'Error', 'error');
    } catch { showMsg('Network error', 'error'); }
    setSaving(false);
  };

  const startEdit = item => {
    setForm({ ...EMPTY_FORM, ...item });
    setEditItem(item);
    setTab('add');
  };

  return (
    <div style={S.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}select option{background:#1a1030}`}</style>

      {/* Header */}
      <div style={S.header}>
        <button onClick={() => router.push('/staff/hostel')} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:'14px' }}>← Back</button>
        <div style={{ textAlign:'center' }}>
          <p style={{ fontWeight:900, fontSize:'13px', textTransform:'uppercase', letterSpacing:'0.1em', margin:0 }}>🏠 Hostel Inventory</p>
          <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.25)', margin:0, textTransform:'uppercase', letterSpacing:'0.1em' }}>Shining Stars</p>
        </div>
        <button onClick={fetchAll} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:'18px' }}>↻</button>
      </div>

      {/* Toast */}
      {msg && (
        <div style={{ position:'fixed', top:'64px', left:'50%', transform:'translateX(-50%)', zIndex:60, padding:'8px 20px', borderRadius:'999px', fontSize:'12px', fontWeight:900, color:'#fff', background: msg.type==='error'?'#ef4444':'#10b981', boxShadow:'0 4px 20px rgba(0,0,0,0.4)', whiteSpace:'nowrap' }}>
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:'6px', padding:'12px 16px 0', overflowX:'auto' }}>
        {[
          { id:'dashboard', label:'📊 Dashboard' },
          { id:'list',      label:`📦 Items (${items.length})` },
          { id:'add',       label: editItem ? '✏️ Edit' : '＋ Add' },
          { id:'log',       label:'📋 Log' },
        ].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); if (t.id==='add' && !editItem) { setForm({ ...EMPTY_FORM, Hostel_Name: hostels[0]||'' }); setEditItem(null); } }} style={tab===t.id ? S.tabOn : S.tabOff}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding:'12px 16px' }}>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'70px 0' }}>
            <div style={{ width:'32px', height:'32px', border:'3px solid rgba(255,255,255,0.1)', borderTop:'3px solid #fbbf24', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <>
            {/* ── DASHBOARD ── */}
            {tab === 'dashboard' && (
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                {/* KPIs */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
                  {[
                    { label:'Total Items', value: items.length,         color:'#60a5fa' },
                    { label:'Low Stock',   value: lowStock.length,      color: lowStock.length   ? '#f87171' : '#34d399' },
                    { label:'Need Repair', value: needRepair.length,    color: needRepair.length ? '#fbbf24' : '#34d399' },
                  ].map((k, i) => (
                    <div key={i} style={{ ...S.card, textAlign:'center', padding:'12px 8px' }}>
                      <div style={{ fontSize:'24px', fontWeight:900, color:k.color }}>{k.value}</div>
                      <div style={{ fontSize:'8px', color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:'3px' }}>{k.label}</div>
                    </div>
                  ))}
                </div>

                {/* Per-hostel cards */}
                {Object.entries(byHostel).map(([hostel, { items: hItems }]) => {
                  const hLow = hItems.filter(i => Number(i.Stock_Qty||0) <= Number(i.Min_Stock||0) && Number(i.Min_Stock||0) > 0);
                  return (
                    <div key={hostel} style={S.card}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                        <p style={{ fontWeight:900, fontSize:'14px', color:'#fbbf24', margin:0 }}>🏠 {hostel}</p>
                        <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)' }}>{hItems.length} items</span>
                      </div>
                      {hItems.slice(0, 6).map((item, j) => {
                        const stock = Number(item.Stock_Qty||0);
                        const minS  = Number(item.Min_Stock||0);
                        const isLow = minS > 0 && stock <= minS;
                        const good  = Number(item.Good_Condition||0);
                        const dmg   = Number(item.Damaged||0);
                        const rep   = Number(item.Need_Repair||0);
                        return (
                          <div key={j} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                            <div style={{ flex:1 }}>
                              <p style={{ fontWeight:900, fontSize:'12px', color:'#fff', margin:'0 0 3px' }}>{item.Item_Name}</p>
                              <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                                {item.Category && <span style={{ fontSize:'9px', color:'rgba(255,255,255,0.25)' }}>{item.Category}</span>}
                                {item.Location && <span style={{ fontSize:'9px', color:'rgba(255,255,255,0.2)' }}>📍{item.Location}</span>}
                              </div>
                            </div>
                            <div style={{ textAlign:'right', flexShrink:0 }}>
                              <div style={{ display:'flex', gap:'6px', alignItems:'center', justifyContent:'flex-end', marginBottom:'2px' }}>
                                {isLow && <span style={{ fontSize:'8px', background:'rgba(248,113,113,0.15)', color:'#f87171', padding:'1px 6px', borderRadius:'99px', fontWeight:900 }}>LOW</span>}
                                <span style={{ fontWeight:900, fontSize:'13px', color: isLow ? '#f87171' : '#fff' }}>{stock} <span style={{ fontSize:'9px', color:'rgba(255,255,255,0.3)' }}>{item.Unit}</span></span>
                              </div>
                              {(good||dmg||rep) ? (
                                <div style={{ display:'flex', gap:'4px', fontSize:'8px', justifyContent:'flex-end' }}>
                                  <span style={{ color:'#34d399' }}>✓{good}</span>
                                  {dmg>0 && <span style={{ color:'#f87171' }}>✗{dmg}</span>}
                                  {rep>0 && <span style={{ color:'#fbbf24' }}>🔧{rep}</span>}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                      {hLow.length > 0 && (
                        <div style={{ marginTop:'8px', background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:'10px', padding:'8px 12px', fontSize:'10px', color:'#f87171', fontWeight:900 }}>
                          ⚠ {hLow.length} item{hLow.length>1?'s':''} low stock
                        </div>
                      )}
                    </div>
                  );
                })}

                {items.length === 0 && (
                  <div style={{ textAlign:'center', padding:'50px 0', color:'rgba(255,255,255,0.2)' }}>
                    <div style={{ fontSize:'36px', marginBottom:'8px' }}>📦</div>
                    <p style={{ margin:'0 0 16px' }}>Item မရှိသေးပါ</p>
                    <button onClick={() => setTab('add')} style={{ ...S.btn, width:'auto', padding:'10px 24px' }}>+ Add First Item</button>
                  </div>
                )}
              </div>
            )}

            {/* ── ITEMS LIST ── */}
            {tab === 'list' && (
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search items..." style={{ ...S.input, flex:1, minWidth:'120px' }} />
                  <select value={hostelFilter} onChange={e => setHostelFilter(e.target.value)} style={{ ...S.select, width:'auto' }}>
                    <option value="All">All Hostels</option>
                    {hostels.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ ...S.select, width:'auto' }}>
                    <option value="All">All Categories</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.25)', margin:0 }}>{filtered.length} items</p>

                {filtered.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'40px 0', color:'rgba(255,255,255,0.2)' }}>Item မတွေ့ပါ</div>
                ) : filtered.map((item, i) => {
                  const stock = Number(item.Stock_Qty||0);
                  const minS  = Number(item.Min_Stock||0);
                  const good  = Number(item.Good_Condition||0);
                  const dmg   = Number(item.Damaged||0);
                  const rep   = Number(item.Need_Repair||0);
                  const isLow = minS > 0 && stock <= minS;
                  return (
                    <div key={i} style={{ ...S.card, borderLeft:`4px solid ${isLow?'#f87171':rep>0?'#fbbf24':'rgba(255,255,255,0.08)'}` }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'10px', marginBottom:'8px' }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap', marginBottom:'3px' }}>
                            <p style={{ fontWeight:900, fontSize:'13px', color:'#fff', margin:0 }}>{item.Item_Name}</p>
                            <span style={{ fontSize:'8px', padding:'1px 8px', borderRadius:'99px', background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.35)', fontWeight:900 }}>{item.Category}</span>
                            {isLow && <span style={{ fontSize:'8px', padding:'1px 8px', borderRadius:'99px', background:'rgba(248,113,113,0.15)', color:'#f87171', fontWeight:900 }}>LOW</span>}
                            {rep > 0 && <span style={{ fontSize:'8px', padding:'1px 8px', borderRadius:'99px', background:'rgba(251,191,36,0.12)', color:'#fbbf24', fontWeight:900 }}>🔧 {rep}</span>}
                          </div>
                          <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.3)', margin:0 }}>
                            🏠 {item.Hostel_Name}{item.Location ? ` · 📍${item.Location}` : ''}{item.Item_ID ? ` · ${item.Item_ID}` : ''}
                          </p>
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          <p style={{ fontWeight:900, fontSize:'20px', color: isLow?'#f87171':'#fff', margin:0 }}>{stock}</p>
                          <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.25)', margin:0 }}>{item.Unit||'Pcs'}</p>
                        </div>
                      </div>

                      {/* Stock bar */}
                      {minS > 0 && (
                        <div style={{ height:'4px', background:'rgba(255,255,255,0.06)', borderRadius:'99px', overflow:'hidden', marginBottom:'8px' }}>
                          <div style={{ height:'100%', width:`${Math.min(100,(stock/Math.max(minS*2,1))*100)}%`, background: isLow?'#f87171':'#34d399', borderRadius:'99px' }} />
                        </div>
                      )}

                      {/* Condition */}
                      {(good || dmg || rep) ? (
                        <div style={{ display:'flex', gap:'10px', marginBottom:'8px' }}>
                          <span style={{ fontSize:'9px', color:'#34d399', fontWeight:900 }}>✓ Good: {good}</span>
                          {dmg > 0 && <span style={{ fontSize:'9px', color:'#f87171', fontWeight:900 }}>✗ Damaged: {dmg}</span>}
                          {rep > 0 && <span style={{ fontSize:'9px', color:'#fbbf24', fontWeight:900 }}>🔧 Repair: {rep}</span>}
                        </div>
                      ) : null}

                      <div style={{ display:'flex', gap:'6px' }}>
                        <button onClick={() => { setUsageModal(item); setUsageForm({ qty:'', action:'Use', good:String(good), damaged:String(dmg), need_repair:String(rep), note:'' }); }}
                          style={{ ...S.btnSm, padding:'7px' }}>📝 Update Stock</button>
                        <button onClick={() => startEdit(item)} style={{ ...S.btnSm, padding:'7px' }}>✏️ Edit</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── ADD / EDIT ── */}
            {tab === 'add' && (
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {editItem && (
                  <div style={{ background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.2)', borderRadius:'12px', padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontWeight:900, fontSize:'12px', color:'#fbbf24' }}>✏️ Editing: {editItem.Item_Name}</span>
                    <button onClick={() => { setEditItem(null); setForm({ ...EMPTY_FORM, Hostel_Name: hostels[0]||'' }); }}
                      style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:'14px' }}>✕</button>
                  </div>
                )}

                <div style={S.card}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label style={S.label}>Hostel *</label>
                      <select value={form.Hostel_Name} onChange={e => setForm(f => ({ ...f, Hostel_Name: e.target.value }))} style={S.select}>
                        {hostels.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label style={S.label}>Item Name *</label>
                      <input value={form.Item_Name} onChange={e => setForm(f => ({ ...f, Item_Name: e.target.value }))} placeholder="e.g. Pillow, Chair, Fan" style={S.input} />
                    </div>
                    <div>
                      <label style={S.label}>Category</label>
                      <select value={form.Category} onChange={e => setForm(f => ({ ...f, Category: e.target.value }))} style={S.select}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={S.label}>Unit</label>
                      <select value={form.Unit} onChange={e => setForm(f => ({ ...f, Unit: e.target.value }))} style={S.select}>
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={S.label}>Total Qty *</label>
                      <input type="number" value={form.Stock_Qty} onChange={e => setForm(f => ({ ...f, Stock_Qty: e.target.value }))} placeholder="0" style={S.input} />
                    </div>
                    <div>
                      <label style={S.label}>Min Stock Alert</label>
                      <input type="number" value={form.Min_Stock} onChange={e => setForm(f => ({ ...f, Min_Stock: e.target.value }))} placeholder="2" style={S.input} />
                    </div>
                  </div>
                </div>

                {/* Condition */}
                <div style={S.card}>
                  <p style={{ ...S.label, marginBottom:'12px', color:'rgba(255,255,255,0.5)' }}>Condition Count</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px' }}>
                    <div>
                      <label style={{ ...S.label, color:'#34d399' }}>Good ✓</label>
                      <input type="number" value={form.Good_Condition} onChange={e => setForm(f => ({ ...f, Good_Condition: e.target.value }))} placeholder="0" style={{ ...S.input, border:'1px solid rgba(52,211,153,0.3)' }} />
                    </div>
                    <div>
                      <label style={{ ...S.label, color:'#f87171' }}>Damaged ✗</label>
                      <input type="number" value={form.Damaged} onChange={e => setForm(f => ({ ...f, Damaged: e.target.value }))} placeholder="0" style={{ ...S.input, border:'1px solid rgba(248,113,113,0.3)' }} />
                    </div>
                    <div>
                      <label style={{ ...S.label, color:'#fbbf24' }}>Need Repair 🔧</label>
                      <input type="number" value={form.Need_Repair} onChange={e => setForm(f => ({ ...f, Need_Repair: e.target.value }))} placeholder="0" style={{ ...S.input, border:'1px solid rgba(251,191,36,0.3)' }} />
                    </div>
                  </div>
                </div>

                {/* Extra info */}
                <div style={S.card}>
                  <p style={{ ...S.label, marginBottom:'12px' }}>Additional Info</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                    <div>
                      <label style={S.label}>Location / Room</label>
                      <input value={form.Location} onChange={e => setForm(f => ({ ...f, Location: e.target.value }))} placeholder="e.g. Room 1, Common" style={S.input} />
                    </div>
                    <div>
                      <label style={S.label}>Unit Price (Ks)</label>
                      <input type="number" value={form.Unit_Price} onChange={e => setForm(f => ({ ...f, Unit_Price: e.target.value }))} placeholder="0" style={S.input} />
                    </div>
                    <div>
                      <label style={S.label}>Serial / Tag No</label>
                      <input value={form.Serial_No} onChange={e => setForm(f => ({ ...f, Serial_No: e.target.value }))} placeholder="Optional" style={S.input} />
                    </div>
                    <div>
                      <label style={S.label}>Purchase Date</label>
                      <input type="date" value={form.Purchase_Date} onChange={e => setForm(f => ({ ...f, Purchase_Date: e.target.value }))} style={S.input} />
                    </div>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label style={S.label}>Note</label>
                      <input value={form.Note} onChange={e => setForm(f => ({ ...f, Note: e.target.value }))} placeholder="Optional" style={S.input} />
                    </div>
                  </div>
                </div>

                <button onClick={handleSave} disabled={saving} style={{ ...S.btn, opacity: saving?0.5:1, cursor: saving?'default':'pointer' }}>
                  {saving ? 'Saving...' : editItem ? '💾 Update Item' : '＋ Add Item'}
                </button>
              </div>
            )}

            {/* ── LOG ── */}
            {tab === 'log' && (
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                <select value={hostelFilter} onChange={e => setHostelFilter(e.target.value)} style={S.select}>
                  <option value="All">All Hostels</option>
                  {hostels.map(h => <option key={h} value={h}>{h}</option>)}
                </select>

                {logs.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'50px 0', color:'rgba(255,255,255,0.2)' }}>Log မရှိသေးပါ</div>
                ) : logs.filter(l => hostelFilter === 'All' || l.Hostel_Name === hostelFilter).slice(0, 60).map((l, i) => {
                  const qty = Number(l.Qty_Change || 0);
                  const pos = qty >= 0;
                  const color = l.Action === 'Restock' ? '#34d399' : l.Action === 'Condition Check' ? '#60a5fa' : '#f87171';
                  return (
                    <div key={i} style={{ ...S.card, padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', borderLeft:`4px solid ${color}` }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'3px' }}>
                          <p style={{ fontWeight:900, fontSize:'12px', color:'#fff', margin:0 }}>{l.Item_Name}</p>
                          <span style={{ fontSize:'8px', padding:'1px 8px', borderRadius:'99px', background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.4)', fontWeight:900 }}>{l.Action}</span>
                        </div>
                        <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.3)', margin:0 }}>
                          🏠{l.Hostel_Name} · {l.Done_By} · {l.Date}
                        </p>
                        {l.Note && <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.2)', margin:'2px 0 0', fontStyle:'italic' }}>"{l.Note}"</p>}
                      </div>
                      {l.Action !== 'Condition Check' && (
                        <span style={{ fontWeight:900, fontSize:'18px', color, flexShrink:0, marginLeft:'10px' }}>
                          {pos ? '+' : ''}{qty}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── UPDATE MODAL ── */}
      {usageModal && (
        <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)', display:'flex', alignItems:'flex-end', justifyContent:'center' }}
          onClick={() => setUsageModal(null)}>
          <div style={{ width:'100%', maxWidth:'440px', background:'#1a1030', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'24px 24px 0 0', padding:'20px', paddingBottom:'32px', display:'flex', flexDirection:'column', gap:'12px' }}
            onClick={e => e.stopPropagation()}>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <p style={{ fontWeight:900, fontSize:'14px', color:'#fff', margin:0 }}>{usageModal.Item_Name}</p>
                <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.3)', margin:0 }}>
                  🏠{usageModal.Hostel_Name} · Stock: {usageModal.Stock_Qty} {usageModal.Unit}
                </p>
              </div>
              <button onClick={() => setUsageModal(null)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', fontSize:'20px' }}>✕</button>
            </div>

            {/* Action buttons */}
            <div style={{ display:'flex', gap:'6px' }}>
              {['Use', 'Restock', 'Condition Check'].map(a => (
                <button key={a} onClick={() => setUsageForm(f => ({ ...f, action: a }))}
                  style={{ flex:1, padding:'8px 4px', borderRadius:'10px', border:'none', cursor:'pointer', fontWeight:900, fontSize:'9px', textTransform:'uppercase',
                    background: usageForm.action===a ? '#fbbf24' : 'rgba(255,255,255,0.06)',
                    color: usageForm.action===a ? '#0f172a' : 'rgba(255,255,255,0.4)' }}>
                  {a === 'Use' ? '📤 Use' : a === 'Restock' ? '📥 Restock' : '🔍 Inspect'}
                </button>
              ))}
            </div>

            {/* Qty (not for condition check) */}
            {usageForm.action !== 'Condition Check' && (
              <div>
                <label style={S.label}>Qty {usageForm.action === 'Restock' ? '(+ Add to stock)' : '(- Remove from stock)'}</label>
                <input type="number" value={usageForm.qty} onChange={e => setUsageForm(f => ({ ...f, qty: e.target.value }))}
                  placeholder="0" style={{ ...S.input, border:`1px solid ${usageForm.action==='Restock'?'rgba(52,211,153,0.4)':'rgba(248,113,113,0.4)'}` }} />
              </div>
            )}

            {/* Condition counts */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px' }}>
              <div>
                <label style={{ ...S.label, color:'#34d399' }}>Good ✓</label>
                <input type="number" value={usageForm.good} onChange={e => setUsageForm(f => ({ ...f, good: e.target.value }))}
                  placeholder={String(usageModal.Good_Condition||0)} style={{ ...S.input, border:'1px solid rgba(52,211,153,0.3)' }} />
              </div>
              <div>
                <label style={{ ...S.label, color:'#f87171' }}>Damaged ✗</label>
                <input type="number" value={usageForm.damaged} onChange={e => setUsageForm(f => ({ ...f, damaged: e.target.value }))}
                  placeholder={String(usageModal.Damaged||0)} style={{ ...S.input, border:'1px solid rgba(248,113,113,0.3)' }} />
              </div>
              <div>
                <label style={{ ...S.label, color:'#fbbf24' }}>Need Repair 🔧</label>
                <input type="number" value={usageForm.need_repair} onChange={e => setUsageForm(f => ({ ...f, need_repair: e.target.value }))}
                  placeholder={String(usageModal.Need_Repair||0)} style={{ ...S.input, border:'1px solid rgba(251,191,36,0.3)' }} />
              </div>
            </div>

            <div>
              <label style={S.label}>Note</label>
              <input value={usageForm.note} onChange={e => setUsageForm(f => ({ ...f, note: e.target.value }))}
                placeholder="Optional remark" style={S.input} />
            </div>

            <button onClick={handleUsage} disabled={saving} style={{ ...S.btn, opacity: saving?0.5:1, cursor: saving?'default':'pointer' }}>
              {saving ? 'Saving...' : '💾 Save Update'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}