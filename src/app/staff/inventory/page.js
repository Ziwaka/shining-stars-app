"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

const CONDITIONS = ['Good', 'Fair', 'Damaged'];
const UNITS = ['Pcs', 'Box', 'Set', 'Bottle', 'Pack', 'Roll', 'Kg', 'Liter'];
const EMPTY_FORM = {
  Item_Name:'', Category:'Stationery', Unit:'Pcs', Stock_Qty:'', Min_Stock:'',
  Unit_Price:'', Condition:'Good', Is_Tool:'FALSE', Serial_No:'', Purchase_Date:'',
  Warranty_Until:'', Location:'', Assigned_To:'', Note:'', Photo_URL:''
};

const S = {
  page: { display:'flex', flexDirection:'column', height:'100dvh', overflow:'hidden', background:'#0f0a1e', color:'#fff', fontFamily:'system-ui,sans-serif' },
  header: { zIndex:40, background:'rgba(15,10,30,0.97)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,0.07)', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' },
  card:   { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'16px', padding:'16px' },
  input:  { width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'12px', padding:'10px 14px', color:'#fff', fontSize:'13px', outline:'none', boxSizing:'border-box' },
  label:  { display:'block', fontSize:'9px', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'6px' },
  btn:    { background:'#fbbf24', color:'#0f172a', border:'none', borderRadius:'14px', padding:'13px', fontSize:'13px', fontWeight:900, width:'100%', cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.06em' },
  btnGhost: { background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.5)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', padding:'8px', fontSize:'9px', fontWeight:900, cursor:'pointer', textTransform:'uppercase', flex:1, textAlign:'center' },
};

export default function InventoryPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dashboard');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [usageModal, setUsageModal] = useState(null);
  const [usageForm, setUsageForm] = useState({ qty:'', action:'Use', note:'' });
  // System_Config driven
  const [invCategories, setInvCategories] = useState(['Stationery','Cleaning','Furniture','Tool','Electronics','Other']);
  const [invLocations,  setInvLocations]  = useState(['Store Room','Office','Classroom','Lab','Gym','Library']);
  // Smart item name: 'existing' picks from list, 'new' free text
  const [nameMode, setNameMode] = useState('existing');

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    if (u.userRole !== 'staff' && u.userRole !== 'management') { router.push('/login'); return; }
    const hasPerm = (key) => u.userRole==='management' || u[key]===true || String(u[key]||'').toUpperCase()==='TRUE';
    if (!hasPerm('Can_Manage_Inventory')) { router.push('/staff'); return;
    }
    setUser(u); fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [invRes, logRes, cfgRes] = await Promise.all([
        fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'getInventory' }) }),
        fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'getInventoryLog' }) }),
        fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'getInventoryConfig' }) }),
      ]);
      const inv = await invRes.json(); const log = await logRes.json(); const cfg = await cfgRes.json();
      if (inv.success) setItems(inv.data || []);
      if (log.success) setLogs(log.data || []);
      if (cfg.success) {
        if (cfg.categories?.length) setInvCategories(cfg.categories);
        if (cfg.locations?.length)  setInvLocations(cfg.locations);
      }
    } catch {} setLoading(false);
  };

  const showMsg = (text, type='success') => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3000); };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result; setPhotoPreview(base64); setPhotoUploading(true);
      try {
        const res = await fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'uploadPhoto', base64, filename:'inventory_'+Date.now()+'.'+file.name.split('.').pop(), mimeType:file.type })});
        const r = await res.json();
        if (r.success) { setForm(f => ({...f, Photo_URL: r.photoUrl})); showMsg('ဓာတ်ပုံ တင်ပြီးပါပြီ ✓'); }
        else showMsg(r.message || 'Upload မအောင်မြင်ပါ', 'error');
      } catch { showMsg('Network error', 'error'); } setPhotoUploading(false);
    }; reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.Item_Name) return showMsg('Item name ထည့်ပါ', 'error');
    setSaving(true);
    try {
      const action = editItem ? 'updateInventoryItem' : 'addInventoryItem';
      const payload = editItem ? { ...form, Item_ID: editItem.Item_ID, Updated_By: user?.name } : { ...form, Updated_By: user?.name };
      const res = await fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action, ...payload }) });
      const r = await res.json();
      if (r.success) { showMsg(editItem?'Update ပြီးပါပြီ':'Item ထည့်ပြီးပါပြီ'); fetchAll(); setForm(EMPTY_FORM); setEditItem(null); setPhotoPreview(null); setTab('items'); }
      else showMsg(r.message || 'Error', 'error');
    } catch { showMsg('Network error', 'error'); } setSaving(false);
  };

  const handleUsageLog = async () => {
    if (!usageForm.qty) return showMsg('Quantity ထည့်ပါ', 'error');
    setSaving(true);
    const qtyChange = usageForm.action==='Use' ? -Math.abs(Number(usageForm.qty)) : Math.abs(Number(usageForm.qty));
    try {
      const res = await fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'logInventoryUsage', Item_ID:usageModal.Item_ID, Item_Name:usageModal.Item_Name, Qty_Change:qtyChange, Action:usageForm.action, Done_By:user?.name, Note:usageForm.note })});
      const r = await res.json();
      if (r.success) { showMsg('Log တင်ပြီးပါပြီ'); fetchAll(); setUsageModal(null); setUsageForm({qty:'',action:'Use',note:''}); }
      else showMsg(r.message||'Error','error');
    } catch { showMsg('Network error','error'); } setSaving(false);
  };

  const totalItems = items.length;
  const totalValue = items.reduce((s,i)=>s+(Number(i.Stock_Qty)||0)*(Number(i.Unit_Price)||0),0);
  const lowStock   = items.filter(i=>Number(i.Stock_Qty)<=Number(i.Min_Stock)&&Number(i.Min_Stock)>0);
  const tools      = items.filter(i=>i.Is_Tool==='TRUE'||i.Is_Tool===true);
  const regularItems = items.filter(i=>i.Is_Tool!=='TRUE'&&i.Is_Tool!==true);
  const filtered   = (tab==='tools'?tools:regularItems).filter(i=>{
    const ms=!search||i.Item_Name?.toLowerCase().includes(search.toLowerCase());
    const mc=catFilter==='All'||i.Category===catFilter; return ms&&mc;
  });
  const startEdit  = (item) => { setEditItem(item); setForm({...EMPTY_FORM,...item}); setPhotoPreview(item.Photo_URL||null); setTab('add'); };

  const TABS = [
    {id:'dashboard',label:'📊 Dashboard'},{id:'items',label:'📦 Items'},
    {id:'tools',label:'🔧 Tools'},{id:'log',label:'📋 Log'},
    {id:'add',label:editItem?'✏️ Edit':'➕ Add'},
  ];

  return (
    <div style={S.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} * {box-sizing:border-box}`}</style>

      <div style={S.header}>
        <button onClick={()=>router.back()} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:'14px'}}>← Back</button>
        <div style={{textAlign:'center'}}>
          <p style={{fontWeight:900,fontSize:'13px',textTransform:'uppercase',letterSpacing:'0.1em',margin:0}}>Inventory</p>
          <p style={{fontSize:'9px',color:'rgba(255,255,255,0.25)',textTransform:'uppercase',letterSpacing:'0.15em',margin:0}}>Shining Stars</p>
        </div>
        <button onClick={fetchAll} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:'18px'}}>↻</button>
      </div>
      <div style={{flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch', paddingBottom:'80px'}}>

      {msg && (
        <div style={{position:'fixed',top:'64px',left:'50%',transform:'translateX(-50%)',zIndex:50,padding:'8px 20px',borderRadius:'999px',fontSize:'12px',fontWeight:900,color:'#fff',background:msg.type==='error'?'#ef4444':'#10b981',boxShadow:'0 4px 20px rgba(0,0,0,0.4)',whiteSpace:'nowrap'}}>
          {msg.text}
        </div>
      )}

      <div style={{display:'flex',gap:'6px',padding:'12px 16px 8px',overflowX:'auto'}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>{setTab(t.id);if(t.id!=='add'){setEditItem(null);setForm(EMPTY_FORM);setPhotoPreview(null);}}}
            style={{background:tab===t.id?'#fbbf24':'rgba(255,255,255,0.06)',color:tab===t.id?'#0f172a':'rgba(255,255,255,0.4)',border:'none',borderRadius:'10px',padding:'7px 14px',fontSize:'10px',fontWeight:900,textTransform:'uppercase',letterSpacing:'0.08em',cursor:'pointer',whiteSpace:'nowrap'}}>
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
            {/* DASHBOARD */}
            {tab==='dashboard' && (
              <div style={{display:'flex',flexDirection:'column',gap:'12px',marginTop:'8px'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                  {[
                    {label:'Total Items',value:totalItems,icon:'📦',color:'#60a5fa'},
                    {label:'Total Value',value:totalValue.toLocaleString()+' ks',icon:'💰',color:'#34d399'},
                    {label:'Low Stock',value:lowStock.length,icon:'⚠️',color:'#fbbf24',alert:lowStock.length>0},
                    {label:'Tools',value:tools.length,icon:'🔧',color:'#c084fc'},
                  ].map((s,i)=>(
                    <div key={i} style={{...S.card,border:s.alert?'1px solid rgba(251,191,36,0.4)':S.card.border}}>
                      <div style={{fontSize:'22px',marginBottom:'6px'}}>{s.icon}</div>
                      <div style={{fontSize:'22px',fontWeight:900,color:s.color}}>{s.value}</div>
                      <div style={{fontSize:'9px',color:'rgba(255,255,255,0.35)',textTransform:'uppercase',letterSpacing:'0.1em',marginTop:'2px'}}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {lowStock.length>0&&(
                  <div style={{background:'rgba(251,191,36,0.08)',border:'1px solid rgba(251,191,36,0.3)',borderRadius:'14px',padding:'14px'}}>
                    <p style={{color:'#fbbf24',fontWeight:900,fontSize:'10px',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'10px',margin:'0 0 10px'}}>⚠ Low Stock Alert</p>
                    {lowStock.map((item,i)=>(
                      <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:i<lowStock.length-1?'1px solid rgba(255,255,255,0.05)':'none'}}>
                        <span style={{color:'rgba(255,255,255,0.7)',fontSize:'12px'}}>{item.Item_Name}</span>
                        <span style={{color:'#fbbf24',fontWeight:900,fontSize:'12px'}}>{item.Stock_Qty} {item.Unit}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={S.card}>
                  <p style={{...S.label,marginBottom:'12px'}}>By Category</p>
                  {invCategories.map(cat=>{
                    const count=items.filter(i=>i.Category===cat).length;
                    if(!count) return null;
                    const pct=Math.round((count/totalItems)*100);
                    return(
                      <div key={cat} style={{marginBottom:'10px'}}>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:'11px',marginBottom:'4px'}}>
                          <span style={{color:'rgba(255,255,255,0.6)'}}>{cat}</span>
                          <span style={{color:'rgba(255,255,255,0.3)'}}>{count}</span>
                        </div>
                        <div style={{height:'4px',background:'rgba(255,255,255,0.06)',borderRadius:'99px',overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${pct}%`,background:'linear-gradient(90deg,#fbbf24,#f59e0b)',borderRadius:'99px'}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {logs.length>0&&(
                  <div style={S.card}>
                    <p style={{...S.label,marginBottom:'12px'}}>Recent Activity</p>
                    {logs.slice(0,6).map((l,i)=>(
                      <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:i<5?'1px solid rgba(255,255,255,0.04)':'none'}}>
                        <div>
                          <span style={{color:'rgba(255,255,255,0.7)',fontSize:'11px'}}>{l.Item_Name}</span>
                          <span style={{marginLeft:'8px',fontWeight:900,fontSize:'11px',color:Number(l.Qty_Change)<0?'#f87171':'#34d399'}}>{Number(l.Qty_Change)>0?'+':''}{l.Qty_Change}</span>
                        </div>
                        <span style={{color:'rgba(255,255,255,0.25)',fontSize:'10px'}}>{l.Date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ITEMS / TOOLS */}
            {(tab==='items'||tab==='tools')&&(
              <div style={{display:'flex',flexDirection:'column',gap:'10px',marginTop:'8px'}}>
                <div style={{display:'flex',gap:'8px'}}>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search items..." style={{...S.input,flex:1}}/>
                  <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} style={{...S.input,width:'auto',flex:'0 0 auto'}}>
                    <option value="All" style={{background:'#1a1030'}}>All</option>
                    {CATEGORIES.map(c=><option key={c} value={c} style={{background:'#1a1030'}}>{c}</option>)}
                  </select>
                </div>
                {filtered.length===0?(
                  <div style={{textAlign:'center',padding:'50px 0',color:'rgba(255,255,255,0.2)',fontSize:'14px'}}>No items found</div>
                ):filtered.map((item,i)=>(
                  <div key={i} style={S.card}>
                    <div style={{display:'flex',gap:'12px',alignItems:'flex-start',marginBottom:'10px'}}>
                      {item.Photo_URL&&(
                        <div style={{width:'52px',height:'52px',borderRadius:'10px',overflow:'hidden',flexShrink:0,background:'rgba(255,255,255,0.05)'}}>
                          <img src={item.Photo_URL} alt={item.Item_Name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        </div>
                      )}
                      <div style={{flex:1}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                          <div>
                            <p style={{fontWeight:900,fontSize:'14px',color:'#fff',margin:'0 0 2px'}}>{item.Item_Name}</p>
                            <p style={{fontSize:'9px',color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:'0.1em',margin:0}}>{item.Category} · {item.Location||'—'}</p>
                          </div>
                          <div style={{textAlign:'right'}}>
                            <p style={{fontWeight:900,fontSize:'16px',margin:0,color:Number(item.Stock_Qty)<=Number(item.Min_Stock)&&Number(item.Min_Stock)>0?'#fbbf24':'#34d399'}}>
                              {item.Stock_Qty} <span style={{fontSize:'10px',color:'rgba(255,255,255,0.3)',fontWeight:400}}>{item.Unit}</span>
                            </p>
                            {item.Unit_Price>0&&<p style={{fontSize:'9px',color:'rgba(255,255,255,0.25)',margin:0}}>{(Number(item.Stock_Qty)*Number(item.Unit_Price)).toLocaleString()} ks</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}>
                      <span style={{padding:'2px 10px',borderRadius:'99px',fontSize:'9px',fontWeight:900,
                        background:item.Condition==='Good'?'rgba(52,211,153,0.12)':item.Condition==='Fair'?'rgba(251,191,36,0.12)':'rgba(248,113,113,0.12)',
                        color:item.Condition==='Good'?'#34d399':item.Condition==='Fair'?'#fbbf24':'#f87171'}}>
                        {item.Condition}
                      </span>
                      {item.Is_Tool==='TRUE'&&item.Serial_No&&<span style={{fontSize:'9px',color:'rgba(192,132,252,0.7)'}}>S/N: {item.Serial_No}</span>}
                    </div>
                    <div style={{display:'flex',gap:'6px'}}>
                      <button onClick={()=>{setUsageModal(item);setUsageForm({qty:'',action:'Use',note:''}); }} style={S.btnGhost}>📊 Log Usage</button>
                      <button onClick={()=>startEdit(item)} style={{...S.btnGhost,color:'rgba(251,191,36,0.7)'}}>✏️ Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* LOG */}
            {tab==='log'&&(
              <div style={{display:'flex',flexDirection:'column',gap:'8px',marginTop:'8px'}}>
                {logs.length===0?<div style={{textAlign:'center',padding:'50px 0',color:'rgba(255,255,255,0.2)'}}>No logs yet</div>
                :logs.map((l,i)=>(
                  <div key={i} style={{...S.card,display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px'}}>
                    <div>
                      <p style={{fontWeight:900,fontSize:'12px',color:'#fff',margin:'0 0 2px'}}>{l.Item_Name}</p>
                      <p style={{fontSize:'9px',color:'rgba(255,255,255,0.3)',margin:0}}>{l.Action} · {l.Done_By} · {l.Date}</p>
                      {l.Note&&<p style={{fontSize:'9px',color:'rgba(255,255,255,0.2)',fontStyle:'italic',margin:'2px 0 0'}}>{l.Note}</p>}
                    </div>
                    <span style={{fontWeight:900,fontSize:'16px',color:Number(l.Qty_Change)<0?'#f87171':'#34d399',marginLeft:'12px',flexShrink:0}}>
                      {Number(l.Qty_Change)>0?'+':''}{l.Qty_Change}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* ADD / EDIT */}
            {tab==='add'&&(
              <div style={{display:'flex',flexDirection:'column',gap:'12px',marginTop:'8px'}}>
                {editItem&&(
                  <div style={{background:'rgba(251,191,36,0.08)',border:'1px solid rgba(251,191,36,0.3)',borderRadius:'12px',padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <p style={{color:'#fbbf24',fontWeight:900,fontSize:'12px',margin:0}}>Editing: {editItem.Item_Name}</p>
                    <button onClick={()=>{setEditItem(null);setForm(EMPTY_FORM);setPhotoPreview(null);}} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:'13px'}}>✕ Cancel</button>
                  </div>
                )}
                <div style={S.card}>
                  <p style={S.label}>Item Type</p>
                  <div style={{display:'flex',gap:'8px'}}>
                    {[{v:'FALSE',label:'📦 Regular'},{v:'TRUE',label:'🔧 Tool'}].map(opt=>(
                      <button key={opt.v} onClick={()=>setForm(f=>({...f,Is_Tool:opt.v}))}
                        style={{flex:1,padding:'10px',borderRadius:'10px',border:'none',cursor:'pointer',fontWeight:900,fontSize:'12px',background:form.Is_Tool===opt.v?'#fbbf24':'rgba(255,255,255,0.06)',color:form.Is_Tool===opt.v?'#0f172a':'rgba(255,255,255,0.4)'}}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{...S.card,display:'flex',flexDirection:'column',gap:'12px'}}>
                  <p style={S.label}>Basic Info</p>
                  <div>
                    <label style={S.label}>Item Name *</label>
                    {/* Toggle: pick existing or type new */}
                    {!editItem && (
                      <div style={{display:'flex',gap:'6px',marginBottom:'8px'}}>
                        {[{v:'existing',label:'📋 Existing'},{v:'new',label:'✨ New Item'}].map(opt=>(
                          <button key={opt.v} onClick={()=>{setNameMode(opt.v);setForm(p=>({...p,Item_Name:''}));}}
                            style={{flex:1,padding:'7px',borderRadius:'9px',border:'none',cursor:'pointer',fontWeight:900,fontSize:'11px',
                              background:nameMode===opt.v?'rgba(251,191,36,0.2)':'rgba(255,255,255,0.05)',
                              color:nameMode===opt.v?'#fbbf24':'rgba(255,255,255,0.3)',
                              outline:nameMode===opt.v?'1px solid rgba(251,191,36,0.4)':'none'}}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {(nameMode==='existing' && !editItem) ? (
                      <select value={form.Item_Name} onChange={e=>{
                        const sel = items.find(i=>i.Item_Name===e.target.value);
                        if (sel) setForm(p=>({...p, Item_Name:sel.Item_Name, Category:sel.Category||p.Category, Unit:sel.Unit||p.Unit, Location:sel.Location||p.Location, Unit_Price:sel.Unit_Price||p.Unit_Price, Is_Tool:sel.Is_Tool||p.Is_Tool}));
                        else setForm(p=>({...p, Item_Name:e.target.value}));
                      }} style={S.input}>
                        <option value="" style={{background:'#1a1030'}}>— ပစ္စည်းရွေးပါ —</option>
                        {[...new Set(items.map(i=>i.Item_Name))].sort().map(n=>(
                          <option key={n} value={n} style={{background:'#1a1030'}}>{n}</option>
                        ))}
                      </select>
                    ) : (
                      <input value={form.Item_Name} onChange={e=>setForm(p=>({...p,Item_Name:e.target.value}))}
                        placeholder="e.g. Whiteboard Marker" style={S.input}/>
                    )}
                    {nameMode==='existing' && !editItem && form.Item_Name && (
                      <p style={{fontSize:'9px',color:'rgba(251,191,36,0.5)',marginTop:'4px'}}>
                        ✓ ရှိပြီးသား ပစ္စည်းကို Stock ထပ်ဖြည့်မည်
                      </p>
                    )}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                    <div><label style={S.label}>Category</label>
                      <select value={form.Category} onChange={e=>setForm(p=>({...p,Category:e.target.value}))} style={S.input}>
                        {invCategories.map(cat=><option key={cat} value={cat} style={{background:'#1a1030'}}>{cat}</option>)}
                      </select>
                    </div>
                    <div><label style={S.label}>Condition</label><select value={form.Condition} onChange={e=>setForm(p=>({...p,Condition:e.target.value}))} style={S.input}>{CONDITIONS.map(c=><option key={c} value={c} style={{background:'#1a1030'}}>{c}</option>)}</select></div>
                  </div>
                  <div>
                    <label style={S.label}>Location</label>
                    <select value={form.Location} onChange={e=>setForm(p=>({...p,Location:e.target.value}))} style={S.input}>
                      <option value="" style={{background:'#1a1030'}}>— ရွေးပါ —</option>
                      {invLocations.map(loc=><option key={loc} value={loc} style={{background:'#1a1030'}}>{loc}</option>)}
                    </select>
                  </div>
                  <div><label style={S.label}>Note</label><input value={form.Note} onChange={e=>setForm(p=>({...p,Note:e.target.value}))} placeholder="Optional" style={S.input}/></div>
                </div>
                <div style={{...S.card,display:'flex',flexDirection:'column',gap:'12px'}}>
                  <p style={S.label}>Stock & Price</p>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
                    <div><label style={S.label}>Unit</label><select value={form.Unit} onChange={e=>setForm(p=>({...p,Unit:e.target.value}))} style={S.input}>{UNITS.map(u=><option key={u} value={u} style={{background:'#1a1030'}}>{u}</option>)}</select></div>
                    <div><label style={S.label}>Qty</label><input type="number" min="0" value={form.Stock_Qty} onChange={e=>setForm(p=>({...p,Stock_Qty:e.target.value}))} placeholder="0" style={S.input}/></div>
                    <div><label style={S.label}>Min Stock</label><input type="number" min="0" value={form.Min_Stock} onChange={e=>setForm(p=>({...p,Min_Stock:e.target.value}))} placeholder="0" style={S.input}/></div>
                  </div>
                  <div>
                    <label style={S.label}>Unit Price (ks)</label>
                    <input type="number" min="0" value={form.Unit_Price} onChange={e=>setForm(p=>({...p,Unit_Price:e.target.value}))} placeholder="0" style={S.input}/>
                    {form.Stock_Qty&&form.Unit_Price&&<p style={{fontSize:'9px',color:'rgba(251,191,36,0.6)',marginTop:'4px'}}>Total: {(Number(form.Stock_Qty)*Number(form.Unit_Price)).toLocaleString()} ks</p>}
                  </div>
                </div>
                {form.Is_Tool==='TRUE'&&(
                  <div style={{...S.card,border:'1px solid rgba(192,132,252,0.2)',display:'flex',flexDirection:'column',gap:'12px'}}>
                    <p style={{...S.label,color:'rgba(192,132,252,0.7)'}}>Tool Details</p>
                    {[{key:'Serial_No',label:'Serial Number',ph:'e.g. TOOL-001'},{key:'Purchase_Date',label:'Purchase Date',ph:'YYYY-MM-DD'},{key:'Warranty_Until',label:'Warranty Until',ph:'YYYY-MM-DD'},{key:'Assigned_To',label:'Assigned To',ph:'e.g. Mr. Kyaw'}].map(f=>(
                      <div key={f.key}><label style={S.label}>{f.label}</label><input value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph} style={{...S.input,borderColor:'rgba(192,132,252,0.2)'}}/></div>
                    ))}
                  </div>
                )}
                <div style={{...S.card,display:'flex',flexDirection:'column',gap:'12px'}}>
                  <p style={S.label}>Item Photo</p>
                  {(photoPreview||form.Photo_URL)&&(
                    <div style={{position:'relative',width:'100%',aspectRatio:'16/9',borderRadius:'12px',overflow:'hidden',background:'rgba(255,255,255,0.05)'}}>
                      <img src={photoPreview||form.Photo_URL} alt="preview" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                      {photoUploading&&<div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{width:'24px',height:'24px',border:'2px solid rgba(255,255,255,0.2)',borderTop:'2px solid #fbbf24',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/></div>}
                      <button onClick={()=>{setPhotoPreview(null);setForm(f=>({...f,Photo_URL:''}));}} style={{position:'absolute',top:'8px',right:'8px',width:'26px',height:'26px',background:'rgba(0,0,0,0.6)',border:'none',borderRadius:'50%',color:'rgba(255,255,255,0.7)',cursor:'pointer',fontSize:'11px'}}>✕</button>
                    </div>
                  )}
                  <div style={{display:'flex',gap:'8px'}}>
                    <label style={{flex:1,cursor:'pointer'}}><input type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={handlePhotoSelect}/><div style={{...S.btnGhost,display:'block',padding:'10px'}}>📷 Camera</div></label>
                    <label style={{flex:1,cursor:'pointer'}}><input type="file" accept="image/*" style={{display:'none'}} onChange={handlePhotoSelect}/><div style={{...S.btnGhost,display:'block',padding:'10px'}}>🖼 Gallery</div></label>
                  </div>
                  {photoUploading&&<p style={{fontSize:'9px',color:'#fbbf24',textAlign:'center',margin:0}}>Uploading to Drive...</p>}
                </div>
                <button onClick={handleSave} disabled={saving} style={{...S.btn,opacity:saving?0.5:1,cursor:saving?'default':'pointer'}}>
                  {saving?'Saving...':editItem?'✓ Update Item':'+ Add Item'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* USAGE MODAL */}
      {usageModal&&(
        <div style={{position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'flex-end',justifyContent:'center',background:'rgba(0,0,0,0.65)',backdropFilter:'blur(6px)',paddingBottom:'72px'}} onClick={()=>setUsageModal(null)}>
          <div style={{width:'100%',maxWidth:'420px',background:'#1a1030',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'24px 24px 0 0',padding:'24px',paddingBottom:'32px',display:'flex',flexDirection:'column',gap:'14px',maxHeight:'85dvh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <p style={{fontWeight:900,fontSize:'14px',color:'#fff',margin:0}}>Log Usage</p>
              <button onClick={()=>setUsageModal(null)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.3)',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <div style={{background:'rgba(255,255,255,0.05)',borderRadius:'12px',padding:'10px 14px'}}>
              <p style={{color:'#fbbf24',fontWeight:900,fontSize:'14px',margin:0}}>{usageModal.Item_Name}</p>
              <p style={{color:'rgba(255,255,255,0.4)',fontSize:'9px',margin:'2px 0 0'}}>Current: {usageModal.Stock_Qty} {usageModal.Unit}</p>
            </div>
            <div style={{display:'flex',gap:'6px'}}>
              {['Use','Restock','Damaged'].map(a=>(
                <button key={a} onClick={()=>setUsageForm(f=>({...f,action:a}))}
                  style={{flex:1,padding:'10px',borderRadius:'10px',border:'none',cursor:'pointer',fontWeight:900,fontSize:'10px',textTransform:'uppercase',background:usageForm.action===a?'#fbbf24':'rgba(255,255,255,0.06)',color:usageForm.action===a?'#0f172a':'rgba(255,255,255,0.4)'}}>
                  {a}
                </button>
              ))}
            </div>
            <div><label style={S.label}>Quantity</label><input type="number" min="1" value={usageForm.qty} onChange={e=>setUsageForm(f=>({...f,qty:e.target.value}))} placeholder="0" style={S.input}/></div>
            <div><label style={S.label}>Note (Optional)</label><input value={usageForm.note} onChange={e=>setUsageForm(f=>({...f,note:e.target.value}))} placeholder="e.g. Used for class A" style={S.input}/></div>
            <button onClick={handleUsageLog} disabled={saving} style={{...S.btn,opacity:saving?0.5:1}}>{saving?'Saving...':'Confirm Log'}</button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}