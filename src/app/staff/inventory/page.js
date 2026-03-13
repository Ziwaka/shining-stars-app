"use client";
import { useState, useEffect, useMemo } from 'react';
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
  page:     { display:'flex', flexDirection:'column', height:'100dvh', overflow:'hidden', background:'#0f0a1e', color:'#fff', fontFamily:'system-ui,sans-serif' },
  header:   { zIndex:40, background:'rgba(15,10,30,0.97)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,0.07)', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' },
  card:     { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'16px', padding:'16px' },
  input:    { width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'12px', padding:'10px 14px', color:'#fff', fontSize:'13px', outline:'none', boxSizing:'border-box' },
  label:    { display:'block', fontSize:'9px', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'6px' },
  btn:      { background:'#fbbf24', color:'#0f172a', border:'none', borderRadius:'14px', padding:'13px', fontSize:'13px', fontWeight:900, width:'100%', cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.06em' },
  btnGhost: { background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.5)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', padding:'8px', fontSize:'9px', fontWeight:900, cursor:'pointer', textTransform:'uppercase', flex:1, textAlign:'center' },
};

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export default function InventoryPage() {
  const router = useRouter();
  const [user,           setUser]           = useState(null);
  const [items,          setItems]          = useState([]);
  const [logs,           setLogs]           = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [tab,            setTab]            = useState('dashboard');
  const [search,         setSearch]         = useState('');
  const [catFilter,      setCatFilter]      = useState('All');
  const [logFilter,      setLogFilter]      = useState('All');  // action filter
  const [logDateFrom,    setLogDateFrom]    = useState('');
  const [logDateTo,      setLogDateTo]      = useState('');
  const [form,           setForm]           = useState(EMPTY_FORM);
  const [editItem,       setEditItem]       = useState(null);
  const [saving,         setSaving]         = useState(false);
  const [msg,            setMsg]            = useState(null);
  const [photoPreview,   setPhotoPreview]   = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [nameMode,       setNameMode]       = useState('existing');
  const [invCategories,  setInvCategories]  = useState(['Stationery','Cleaning','Furniture','Tool','Electronics','Other']);
  const [invLocations,   setInvLocations]   = useState(['Store Room','Office','Classroom','Lab','Gym','Library']);

  // Modals
  const [usageModal,     setUsageModal]     = useState(null);
  const [usageForm,      setUsageForm]      = useState({ qty:'', action:'Use', note:'' });
  const [transferModal,  setTransferModal]  = useState(null);
  const [transferLoc,    setTransferLoc]    = useState('');
  const [transferNote,   setTransferNote]   = useState('');
  const [detailModal,    setDetailModal]    = useState(null);  // item detail + history
  const [detailHistory,  setDetailHistory]  = useState([]);
  const [detailLoading,  setDetailLoading]  = useState(false);
  const [requestModal,   setRequestModal]   = useState(null);  // purchase request
  const [requestForm,    setRequestForm]    = useState({ qty:'', reason:'' });
  const [configModal,    setConfigModal]    = useState(null);
  const [configNew,      setConfigNew]      = useState('');
  const [configSaving,   setConfigSaving]   = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    if (u.userRole !== 'staff' && u.userRole !== 'management') { router.push('/login'); return; }
    const checkPerm = (key) => u.userRole==='management' || u[key]===true || String(u[key]||'').toUpperCase()==='TRUE';
    if (u.userRole === 'management') { setUser(u); fetchAll(); return; }
    if (checkPerm('Can_Manage_Inventory')) { setUser(u); fetchAll(); return; }
    fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'getStaffPermissions' }) })
      .then(r=>r.json()).then(res => {
        const fresh = res.success && res.data && res.data.find(s =>
          (s.Staff_ID && s.Staff_ID.toString()===u.Staff_ID?.toString()) ||
          (s.Name && (s.Name===u['Name (ALL CAPITAL)']||s.Name===u.Name)));
        if (fresh) {
          const up={...u,...fresh};
          localStorage.setItem('user',JSON.stringify(up));
          if (!(up['Can_Manage_Inventory']===true||String(up['Can_Manage_Inventory']||'').toUpperCase()==='TRUE')){router.push('/staff');return;}
          setUser(up); fetchAll(); return;
        }
        router.push('/staff');
      }).catch(()=>router.push('/staff'));
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
    } catch {}
    setLoading(false);
  };

  const showMsg = (text, type='success') => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3000); };

  // ── Item detail + history ──
  const openDetail = async (item) => {
    setDetailModal(item);
    setDetailHistory([]);
    setDetailLoading(true);
    try {
      const res = await fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'getItemHistory', Item_ID: item.Item_ID }) });
      const r   = await res.json();
      if (r.success) setDetailHistory(r.data || []);
    } catch {}
    setDetailLoading(false);
  };

  // ── Transfer ──
  const handleTransfer = async () => {
    if (!transferLoc) return showMsg('Location ရွေးပါ','error');
    setSaving(true);
    try {
      const res = await fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({
        action:'transferInventoryItem', Item_ID:transferModal.Item_ID,
        Item_Name:transferModal.Item_Name, New_Location:transferLoc,
        Done_By:user?.Name||user?.username||'', Note:transferNote,
      })});
      const r = await res.json();
      if (r.success) { showMsg('Transfer ပြီးပါပြီ ✓'); setTransferModal(null); setTransferLoc(''); setTransferNote(''); fetchAll(); }
      else showMsg(r.message||'Error','error');
    } catch { showMsg('Network error','error'); }
    setSaving(false);
  };

  // ── Purchase Request ──
  const handleRequest = async () => {
    if (!requestForm.qty) return showMsg('Quantity ထည့်ပါ','error');
    if (!requestForm.reason) return showMsg('Reason ထည့်ပါ','error');
    setSaving(true);
    try {
      const res = await fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({
        action:'submitPurchaseRequest', Item_Name:requestModal.Item_Name,
        Category:requestModal.Category, Qty:requestForm.qty,
        Unit:requestModal.Unit, Reason:requestForm.reason,
        Requested_By:user?.Name||user?.username||'',
      })});
      const r = await res.json();
      if (r.success) { showMsg(r.message||'Request တင်ပြီးပါပြီ'); setRequestModal(null); setRequestForm({qty:'',reason:''}); }
      else showMsg(r.message||'Error','error');
    } catch { showMsg('Network error','error'); }
    setSaving(false);
  };

  // ── Config ──
  const handleAddConfig = async () => {
    const val = configNew.trim(); if (!val) return;
    setConfigSaving(true);
    try {
      const isCategory = configModal === 'category';
      const updated = isCategory ? [...invCategories, val] : [...invLocations, val];
      const payload  = isCategory ? { action:'saveInventoryConfig', categories:updated } : { action:'saveInventoryConfig', locations:updated };
      const res = await fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify(payload) });
      const r   = await res.json();
      if (r.success) { isCategory ? setInvCategories(updated) : setInvLocations(updated); showMsg(`"${val}" ထည့်ပြီးပါပြီ ✓`); setConfigModal(null); setConfigNew(''); }
      else showMsg(r.message||'Error','error');
    } catch { showMsg('Network error','error'); }
    setConfigSaving(false);
  };

  const handleRemoveConfig = async (type, val) => {
    if (!confirm(`"${val}" ဖျက်မှာ သေချာပြီလား?`)) return;
    const updated = type==='category' ? invCategories.filter(c=>c!==val) : invLocations.filter(l=>l!==val);
    try {
      const payload = type==='category' ? { action:'saveInventoryConfig', categories:updated } : { action:'saveInventoryConfig', locations:updated };
      const res = await fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify(payload) });
      const r   = await res.json();
      if (r.success) { type==='category' ? setInvCategories(updated) : setInvLocations(updated); showMsg(`"${val}" ဖျက်ပြီးပါပြီ`); }
      else showMsg(r.message||'Error','error');
    } catch { showMsg('Network error','error'); }
  };

  // ── Usage Log ──
  const handleUsageLog = async () => {
    if (!usageForm.qty) return showMsg('Quantity ထည့်ပါ','error');
    setSaving(true);
    const qtyChange = usageForm.action==='Use' ? -Math.abs(Number(usageForm.qty)) : Math.abs(Number(usageForm.qty));
    try {
      const res = await fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({
        action:'logInventoryUsage', Item_ID:usageModal.Item_ID, Item_Name:usageModal.Item_Name,
        Qty_Change:qtyChange, Action:usageForm.action, Done_By:user?.Name||user?.username, Note:usageForm.note,
      })});
      const r = await res.json();
      if (r.success) { showMsg('Log တင်ပြီးပါပြီ'); fetchAll(); setUsageModal(null); setUsageForm({qty:'',action:'Use',note:''}); }
      else showMsg(r.message||'Error','error');
    } catch { showMsg('Network error','error'); }
    setSaving(false);
  };

  // ── Photo ──
  const handlePhotoSelect = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result; setPhotoPreview(base64); setPhotoUploading(true);
      try {
        const res = await fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action:'uploadPhoto', base64, filename:'inventory_'+Date.now()+'.'+file.name.split('.').pop(), mimeType:file.type })});
        const r   = await res.json();
        if (r.success) { setForm(f=>({...f,Photo_URL:r.photoUrl})); showMsg('ဓာတ်ပုံ တင်ပြီးပါပြီ ✓'); }
        else showMsg(r.message||'Upload မအောင်မြင်ပါ','error');
      } catch { showMsg('Network error','error'); }
      setPhotoUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // ── Save Item ──
  const handleSave = async () => {
    if (!form.Item_Name) return showMsg('Item name ထည့်ပါ','error');
    setSaving(true);
    try {
      const action  = editItem ? 'updateInventoryItem' : 'addInventoryItem';
      const payload = editItem ? { ...form, Item_ID:editItem.Item_ID, Updated_By:user?.Name } : { ...form, Updated_By:user?.Name };
      const res = await fetch(WEB_APP_URL, { method:'POST', body: JSON.stringify({ action, ...payload }) });
      const r   = await res.json();
      if (r.success) { showMsg(editItem?'Update ပြီးပါပြီ':'Item ထည့်ပြီးပါပြီ'); fetchAll(); setForm(EMPTY_FORM); setEditItem(null); setPhotoPreview(null); setTab('items'); }
      else showMsg(r.message||'Error','error');
    } catch { showMsg('Network error','error'); }
    setSaving(false);
  };

  // ── Print report ──
  const handlePrint = () => {
    const lowStock  = items.filter(i=>Number(i.Stock_Qty)<=Number(i.Min_Stock)&&Number(i.Min_Stock)>0);
    const expirying = items.filter(i=>{ const d=daysUntil(i.Warranty_Until); return d!==null&&d<=30&&d>=0; });
    const html = `<!DOCTYPE html><html><head><title>Inventory Report — Shining Stars</title>
<style>body{font-family:sans-serif;padding:24px;color:#111}h1{font-size:18px}h2{font-size:13px;margin-top:24px;border-bottom:2px solid #000;padding-bottom:4px}
table{width:100%;border-collapse:collapse;font-size:11px}th{background:#111;color:#fff;padding:6px 8px;text-align:left}
td{padding:5px 8px;border-bottom:1px solid #eee}.warn{color:#b45309;font-weight:bold}.ok{color:#047857}
@media print{button{display:none}}</style></head><body>
<h1>📦 Inventory Report — Shining Stars</h1>
<p style="font-size:11px;color:#666">Generated: ${new Date().toLocaleString()}</p>
<h2>All Items (${items.length})</h2>
<table><tr><th>Item</th><th>Category</th><th>Location</th><th>Qty</th><th>Unit</th><th>Value (ks)</th><th>Condition</th></tr>
${items.map(i=>`<tr><td>${i.Item_Name}</td><td>${i.Category||'—'}</td><td>${i.Location||'—'}</td>
<td class="${Number(i.Stock_Qty)<=Number(i.Min_Stock)&&Number(i.Min_Stock)>0?'warn':'ok'}">${i.Stock_Qty}</td>
<td>${i.Unit}</td><td>${((Number(i.Stock_Qty)||0)*(Number(i.Unit_Price)||0)).toLocaleString()}</td><td>${i.Condition||'—'}</td></tr>`).join('')}
</table>
${lowStock.length?`<h2>⚠ Low Stock (${lowStock.length})</h2><table><tr><th>Item</th><th>Qty</th><th>Min</th><th>Unit</th></tr>
${lowStock.map(i=>`<tr><td>${i.Item_Name}</td><td class="warn">${i.Stock_Qty}</td><td>${i.Min_Stock}</td><td>${i.Unit}</td></tr>`).join('')}</table>`:''}
${expirying.length?`<h2>🔧 Warranty Expiring (${expirying.length})</h2><table><tr><th>Item</th><th>Serial</th><th>Warranty Until</th><th>Days Left</th></tr>
${expirying.map(i=>`<tr><td>${i.Item_Name}</td><td>${i.Serial_No||'—'}</td><td>${i.Warranty_Until}</td><td class="warn">${daysUntil(i.Warranty_Until)}</td></tr>`).join('')}</table>`:''}
</body></html>`;
    const w = window.open('','_blank');
    w.document.write(html);
    w.document.close();
    setTimeout(()=>w.print(), 400);
  };

  // ── Derived data ──
  const totalItems   = items.length;
  const totalValue   = items.reduce((s,i)=>s+(Number(i.Stock_Qty)||0)*(Number(i.Unit_Price)||0),0);
  const lowStock     = items.filter(i=>Number(i.Stock_Qty)<=Number(i.Min_Stock)&&Number(i.Min_Stock)>0);
  const tools        = items.filter(i=>i.Is_Tool==='TRUE'||i.Is_Tool===true);
  const regularItems = items.filter(i=>i.Is_Tool!=='TRUE'&&i.Is_Tool!==true);
  const expiringWarranty = items.filter(i=>{ const d=daysUntil(i.Warranty_Until); return d!==null&&d<=30&&d>=0; });

  const filtered = (tab==='tools'?tools:regularItems).filter(i=>{
    const ms=!search||i.Item_Name?.toLowerCase().includes(search.toLowerCase());
    const mc=catFilter==='All'||i.Category===catFilter;
    return ms&&mc;
  });

  const filteredLogs = useMemo(()=>logs.filter(l=>{
    if (logFilter!=='All'&&l.Action!==logFilter) return false;
    if (logDateFrom && l.Date < logDateFrom) return false;
    if (logDateTo   && l.Date > logDateTo)   return false;
    return true;
  }),[logs, logFilter, logDateFrom, logDateTo]);

  const startEdit = (item) => { setEditItem(item); setForm({...EMPTY_FORM,...item}); setPhotoPreview(item.Photo_URL||null); setTab('add'); };

  const TABS = [
    {id:'dashboard',label:'📊'},
    {id:'items',    label:'📦 Items'},
    {id:'tools',    label:'🔧 Tools'},
    {id:'log',      label:'📋 Log'},
    {id:'add',      label:editItem?'✏️':'➕'},
    {id:'config',   label:'⚙️'},
  ];

  return (
    <div style={S.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box} select option{background:#1a1030}`}</style>

      {/* Header */}
      <div style={S.header}>
        <button onClick={()=>router.back()} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:'14px'}}>← Back</button>
        <div style={{textAlign:'center'}}>
          <p style={{fontWeight:900,fontSize:'13px',textTransform:'uppercase',letterSpacing:'0.1em',margin:0}}>Inventory</p>
          {(lowStock.length>0||expiringWarranty.length>0)&&(
            <p style={{fontSize:'9px',color:'#fbbf24',margin:0}}>
              {lowStock.length>0&&`⚠ ${lowStock.length} low stock`}
              {lowStock.length>0&&expiringWarranty.length>0&&' · '}
              {expiringWarranty.length>0&&`🔧 ${expiringWarranty.length} warranty expiring`}
            </p>
          )}
        </div>
        <div style={{display:'flex',gap:'6px'}}>
          <button onClick={handlePrint} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:'16px'}}>🖨</button>
          <button onClick={fetchAll}    style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:'18px'}}>↻</button>
        </div>
      </div>

      <div style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch',paddingBottom:'80px'}}>

        {/* Toast */}
        {msg&&(
          <div style={{position:'fixed',top:'64px',left:'50%',transform:'translateX(-50%)',zIndex:99,padding:'8px 20px',borderRadius:'999px',fontSize:'12px',fontWeight:900,color:'#fff',background:msg.type==='error'?'#ef4444':'#10b981',boxShadow:'0 4px 20px rgba(0,0,0,0.4)',whiteSpace:'nowrap'}}>
            {msg.text}
          </div>
        )}

        {/* Tabs */}
        <div style={{display:'flex',gap:'6px',padding:'12px 16px 8px',overflowX:'auto'}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>{setTab(t.id);if(t.id!=='add'){setEditItem(null);setForm(EMPTY_FORM);setPhotoPreview(null);}}}
              style={{background:tab===t.id?'#fbbf24':'rgba(255,255,255,0.06)',color:tab===t.id?'#0f172a':'rgba(255,255,255,0.4)',border:'none',borderRadius:'10px',padding:'7px 14px',fontSize:'10px',fontWeight:900,textTransform:'uppercase',cursor:'pointer',whiteSpace:'nowrap',position:'relative'}}>
              {t.label}
              {t.id==='dashboard'&&(lowStock.length>0||expiringWarranty.length>0)&&tab!=='dashboard'&&(
                <span style={{position:'absolute',top:'-3px',right:'-3px',width:'8px',height:'8px',borderRadius:'50%',background:'#f87171'}}/>
              )}
            </button>
          ))}
        </div>

        <div style={{padding:'0 16px'}}>
          {loading?(
            <div style={{display:'flex',justifyContent:'center',padding:'60px 0'}}>
              <div style={{width:'32px',height:'32px',border:'3px solid rgba(255,255,255,0.1)',borderTop:'3px solid #fbbf24',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
            </div>
          ):(
            <>
              {/* ── DASHBOARD ── */}
              {tab==='dashboard'&&(
                <div style={{display:'flex',flexDirection:'column',gap:'12px',marginTop:'8px'}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                    {[
                      {label:'Total Items',value:totalItems,             icon:'📦',color:'#60a5fa'},
                      {label:'Total Value',value:totalValue.toLocaleString()+' ks',icon:'💰',color:'#34d399'},
                      {label:'Low Stock',  value:lowStock.length,        icon:'⚠️',color:'#fbbf24',alert:lowStock.length>0},
                      {label:'Tools',      value:tools.length,           icon:'🔧',color:'#c084fc'},
                    ].map((s,i)=>(
                      <div key={i} style={{...S.card,border:s.alert?'1px solid rgba(251,191,36,0.4)':S.card.border}}>
                        <div style={{fontSize:'22px',marginBottom:'6px'}}>{s.icon}</div>
                        <div style={{fontSize:'22px',fontWeight:900,color:s.color}}>{s.value}</div>
                        <div style={{fontSize:'9px',color:'rgba(255,255,255,0.35)',textTransform:'uppercase',letterSpacing:'0.1em',marginTop:'2px'}}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Warranty expiry alert */}
                  {expiringWarranty.length>0&&(
                    <div style={{background:'rgba(192,132,252,0.08)',border:'1px solid rgba(192,132,252,0.3)',borderRadius:'14px',padding:'14px'}}>
                      <p style={{color:'#c084fc',fontWeight:900,fontSize:'10px',textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 10px'}}>🔧 Warranty Expiring Soon</p>
                      {expiringWarranty.map((item,i)=>{
                        const d=daysUntil(item.Warranty_Until);
                        return(
                          <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:i<expiringWarranty.length-1?'1px solid rgba(255,255,255,0.05)':'none'}}>
                            <span style={{color:'rgba(255,255,255,0.7)',fontSize:'12px'}}>{item.Item_Name}</span>
                            <span style={{color:d<=7?'#f87171':'#fbbf24',fontWeight:900,fontSize:'12px'}}>{d===0?'Today':d+'d left'}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Low stock */}
                  {lowStock.length>0&&(
                    <div style={{background:'rgba(251,191,36,0.08)',border:'1px solid rgba(251,191,36,0.3)',borderRadius:'14px',padding:'14px'}}>
                      <p style={{color:'#fbbf24',fontWeight:900,fontSize:'10px',textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 10px'}}>⚠ Low Stock Alert</p>
                      {lowStock.map((item,i)=>(
                        <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:i<lowStock.length-1?'1px solid rgba(255,255,255,0.05)':'none'}}>
                          <span style={{color:'rgba(255,255,255,0.7)',fontSize:'12px'}}>{item.Item_Name}</span>
                          <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                            <span style={{color:'#fbbf24',fontWeight:900,fontSize:'12px'}}>{item.Stock_Qty} {item.Unit}</span>
                            <button onClick={()=>{setRequestModal(item);setRequestForm({qty:'',reason:'Low stock'});}}
                              style={{background:'rgba(251,191,36,0.15)',border:'1px solid rgba(251,191,36,0.3)',color:'#fbbf24',borderRadius:'6px',padding:'2px 8px',fontSize:'9px',fontWeight:900,cursor:'pointer'}}>
                              Request
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* By category */}
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

                  {/* By location */}
                  <div style={S.card}>
                    <p style={{...S.label,marginBottom:'12px'}}>By Location</p>
                    {invLocations.map(loc=>{
                      const count=items.filter(i=>i.Location===loc).length;
                      if(!count) return null;
                      return(
                        <div key={loc} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid rgba(255,255,255,0.04)',fontSize:'12px'}}>
                          <span style={{color:'rgba(255,255,255,0.6)'}}>📍 {loc}</span>
                          <span style={{color:'rgba(255,255,255,0.4)',fontWeight:700}}>{count} items</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Recent activity */}
                  {logs.length>0&&(
                    <div style={S.card}>
                      <p style={{...S.label,marginBottom:'12px'}}>Recent Activity</p>
                      {logs.slice(0,8).map((l,i)=>(
                        <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:i<7?'1px solid rgba(255,255,255,0.04)':'none'}}>
                          <div>
                            <span style={{color:'rgba(255,255,255,0.7)',fontSize:'11px'}}>{l.Item_Name}</span>
                            <span style={{marginLeft:'6px',fontSize:'9px',color:'rgba(255,255,255,0.3)'}}>{l.Action}</span>
                          </div>
                          <span style={{fontWeight:900,fontSize:'12px',color:l.Action==='Transfer'?'#60a5fa':Number(l.Qty_Change)<0?'#f87171':'#34d399'}}>
                            {l.Action==='Transfer'?'→ moved':Number(l.Qty_Change)>0?'+'+l.Qty_Change:l.Qty_Change}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── ITEMS / TOOLS ── */}
              {(tab==='items'||tab==='tools')&&(
                <div style={{display:'flex',flexDirection:'column',gap:'10px',marginTop:'8px'}}>
                  <div style={{display:'flex',gap:'8px'}}>
                    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{...S.input,flex:1}}/>
                    <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} style={{...S.input,width:'auto'}}>
                      <option value="All">All</option>
                      {invCategories.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <p style={{fontSize:'10px',color:'rgba(255,255,255,0.25)',margin:0}}>{filtered.length} items</p>
                  {filtered.length===0?(
                    <div style={{textAlign:'center',padding:'50px 0',color:'rgba(255,255,255,0.2)',fontSize:'14px'}}>No items found</div>
                  ):filtered.map((item,i)=>{
                    const warrantyDays = daysUntil(item.Warranty_Until);
                    const warrantyAlert = warrantyDays !== null && warrantyDays <= 30 && warrantyDays >= 0;
                    return(
                      <div key={i} style={{...S.card,border:warrantyAlert?'1px solid rgba(192,132,252,0.3)':S.card.border}}>
                        <div style={{display:'flex',gap:'12px',alignItems:'flex-start',marginBottom:'10px'}}>
                          {item.Photo_URL&&(
                            <div style={{width:'52px',height:'52px',borderRadius:'10px',overflow:'hidden',flexShrink:0}}>
                              <img src={item.Photo_URL} alt={item.Item_Name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                            </div>
                          )}
                          <div style={{flex:1}}>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                              <div>
                                <p style={{fontWeight:900,fontSize:'14px',color:'#fff',margin:'0 0 2px'}}>{item.Item_Name}</p>
                                <p style={{fontSize:'9px',color:'rgba(255,255,255,0.3)',margin:0}}>{item.Category} · 📍{item.Location||'—'}</p>
                                {warrantyAlert&&<p style={{fontSize:'9px',color:'#c084fc',margin:'2px 0 0',fontWeight:900}}>🔧 Warranty: {warrantyDays}d left</p>}
                              </div>
                              <div style={{textAlign:'right'}}>
                                <p style={{fontWeight:900,fontSize:'16px',margin:0,color:Number(item.Stock_Qty)<=Number(item.Min_Stock)&&Number(item.Min_Stock)>0?'#fbbf24':'#34d399'}}>
                                  {item.Stock_Qty}<span style={{fontSize:'10px',color:'rgba(255,255,255,0.3)',fontWeight:400}}> {item.Unit}</span>
                                </p>
                                {item.Unit_Price>0&&<p style={{fontSize:'9px',color:'rgba(255,255,255,0.25)',margin:0}}>{((Number(item.Stock_Qty)||0)*(Number(item.Unit_Price)||0)).toLocaleString()} ks</p>}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div style={{display:'flex',gap:'6px'}}>
                          <button onClick={()=>openDetail(item)}       style={S.btnGhost}>📋 Detail</button>
                          <button onClick={()=>{setUsageModal(item);setUsageForm({qty:'',action:'Use',note:''}); }} style={S.btnGhost}>📊 Log</button>
                          <button onClick={()=>{setTransferModal(item);setTransferLoc('');setTransferNote('');}} style={{...S.btnGhost,color:'rgba(96,165,250,0.7)'}}>📍</button>
                          <button onClick={()=>{setRequestModal(item);setRequestForm({qty:'',reason:''}); }} style={{...S.btnGhost,color:'rgba(251,191,36,0.7)'}}>🛒</button>
                          <button onClick={()=>startEdit(item)} style={{...S.btnGhost,color:'rgba(251,191,36,0.5)'}}>✏️</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── LOG ── */}
              {tab==='log'&&(
                <div style={{display:'flex',flexDirection:'column',gap:'8px',marginTop:'8px'}}>
                  {/* Filters */}
                  <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                    {['All','Use','Restock','Transfer','Damaged'].map(a=>(
                      <button key={a} onClick={()=>setLogFilter(a)}
                        style={{padding:'5px 12px',borderRadius:'8px',border:'none',cursor:'pointer',fontWeight:900,fontSize:'10px',
                          background:logFilter===a?'#fbbf24':'rgba(255,255,255,0.06)',
                          color:logFilter===a?'#0f172a':'rgba(255,255,255,0.4)'}}>
                        {a}
                      </button>
                    ))}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px'}}>
                    <div>
                      <label style={S.label}>From</label>
                      <input type="date" value={logDateFrom} onChange={e=>setLogDateFrom(e.target.value)} style={{...S.input,fontSize:'11px',padding:'7px 10px'}}/>
                    </div>
                    <div>
                      <label style={S.label}>To</label>
                      <input type="date" value={logDateTo} onChange={e=>setLogDateTo(e.target.value)} style={{...S.input,fontSize:'11px',padding:'7px 10px'}}/>
                    </div>
                  </div>
                  <p style={{fontSize:'10px',color:'rgba(255,255,255,0.25)',margin:0}}>{filteredLogs.length} entries</p>
                  {filteredLogs.length===0?<div style={{textAlign:'center',padding:'40px 0',color:'rgba(255,255,255,0.2)'}}>No logs found</div>
                  :filteredLogs.map((l,i)=>(
                    <div key={i} style={{...S.card,display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px'}}>
                      <div>
                        <p style={{fontWeight:900,fontSize:'12px',color:'#fff',margin:'0 0 2px'}}>{l.Item_Name}</p>
                        <p style={{fontSize:'9px',color:'rgba(255,255,255,0.3)',margin:0}}>{l.Action} · {l.Done_By} · {l.Date}</p>
                        {l.Note&&<p style={{fontSize:'9px',color:'rgba(255,255,255,0.2)',fontStyle:'italic',margin:'2px 0 0'}}>{l.Note}</p>}
                      </div>
                      <span style={{fontWeight:900,fontSize:'15px',marginLeft:'12px',flexShrink:0,
                        color:l.Action==='Transfer'?'#60a5fa':l.Action==='Damaged'?'#f87171':Number(l.Qty_Change)<0?'#f87171':'#34d399'}}>
                        {l.Action==='Transfer'?'📍':Number(l.Qty_Change)>0?'+':''}{l.Action==='Transfer'?'':l.Qty_Change}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* ── ADD / EDIT ── */}
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
                          style={{flex:1,padding:'10px',borderRadius:'10px',border:'none',cursor:'pointer',fontWeight:900,fontSize:'12px',
                            background:form.Is_Tool===opt.v?'#fbbf24':'rgba(255,255,255,0.06)',
                            color:form.Is_Tool===opt.v?'#0f172a':'rgba(255,255,255,0.4)'}}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{...S.card,display:'flex',flexDirection:'column',gap:'12px'}}>
                    <p style={S.label}>Basic Info</p>
                    <div>
                      <label style={S.label}>Item Name *</label>
                      {!editItem&&(
                        <div style={{display:'flex',gap:'6px',marginBottom:'8px'}}>
                          {[{v:'existing',label:'📋 Existing'},{v:'new',label:'✨ New'}].map(opt=>(
                            <button key={opt.v} onClick={()=>{setNameMode(opt.v);setForm(p=>({...p,Item_Name:''}));}}
                              style={{flex:1,padding:'7px',borderRadius:'9px',border:'none',cursor:'pointer',fontWeight:900,fontSize:'11px',
                                background:nameMode===opt.v?'rgba(251,191,36,0.2)':'rgba(255,255,255,0.05)',
                                color:nameMode===opt.v?'#fbbf24':'rgba(255,255,255,0.3)'}}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                      {(nameMode==='existing'&&!editItem)?(
                        <select value={form.Item_Name} onChange={e=>{
                          const sel=items.find(i=>i.Item_Name===e.target.value);
                          if(sel) setForm(p=>({...p,Item_Name:sel.Item_Name,Category:sel.Category||p.Category,Unit:sel.Unit||p.Unit,Location:sel.Location||p.Location,Unit_Price:sel.Unit_Price||p.Unit_Price,Is_Tool:sel.Is_Tool||p.Is_Tool}));
                          else setForm(p=>({...p,Item_Name:e.target.value}));
                        }} style={S.input}>
                          <option value="">— ပစ္စည်းရွေးပါ —</option>
                          {[...new Set(items.map(i=>i.Item_Name))].sort().map(n=><option key={n} value={n}>{n}</option>)}
                        </select>
                      ):(
                        <input value={form.Item_Name} onChange={e=>setForm(p=>({...p,Item_Name:e.target.value}))} placeholder="e.g. Whiteboard Marker" style={S.input}/>
                      )}
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                      <div><label style={S.label}>Category</label>
                        <select value={form.Category} onChange={e=>setForm(p=>({...p,Category:e.target.value}))} style={S.input}>
                          {invCategories.map(c=><option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div><label style={S.label}>Condition</label>
                        <select value={form.Condition} onChange={e=>setForm(p=>({...p,Condition:e.target.value}))} style={S.input}>
                          {CONDITIONS.map(c=><option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div><label style={S.label}>Location</label>
                      <select value={form.Location} onChange={e=>setForm(p=>({...p,Location:e.target.value}))} style={S.input}>
                        <option value="">— ရွေးပါ —</option>
                        {invLocations.map(l=><option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div><label style={S.label}>Note</label><input value={form.Note} onChange={e=>setForm(p=>({...p,Note:e.target.value}))} placeholder="Optional" style={S.input}/></div>
                  </div>
                  <div style={{...S.card,display:'flex',flexDirection:'column',gap:'12px'}}>
                    <p style={S.label}>Stock & Price</p>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
                      <div><label style={S.label}>Unit</label><select value={form.Unit} onChange={e=>setForm(p=>({...p,Unit:e.target.value}))} style={S.input}>{UNITS.map(u=><option key={u} value={u}>{u}</option>)}</select></div>
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
                      {[{key:'Serial_No',label:'Serial Number',ph:'TOOL-001'},{key:'Purchase_Date',label:'Purchase Date',ph:'YYYY-MM-DD'},{key:'Warranty_Until',label:'Warranty Until',ph:'YYYY-MM-DD'},{key:'Assigned_To',label:'Assigned To',ph:'e.g. Mr. Kyaw'}].map(f=>(
                        <div key={f.key}><label style={S.label}>{f.label}</label><input value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph} style={{...S.input,borderColor:'rgba(192,132,252,0.2)'}}/></div>
                      ))}
                    </div>
                  )}
                  <div style={{...S.card,display:'flex',flexDirection:'column',gap:'12px'}}>
                    <p style={S.label}>Item Photo</p>
                    {(photoPreview||form.Photo_URL)&&(
                      <div style={{position:'relative',width:'100%',aspectRatio:'16/9',borderRadius:'12px',overflow:'hidden'}}>
                        <img src={photoPreview||form.Photo_URL} alt="preview" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        {photoUploading&&<div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{width:'24px',height:'24px',border:'2px solid rgba(255,255,255,0.2)',borderTop:'2px solid #fbbf24',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/></div>}
                        <button onClick={()=>{setPhotoPreview(null);setForm(f=>({...f,Photo_URL:''}));}} style={{position:'absolute',top:'8px',right:'8px',width:'26px',height:'26px',background:'rgba(0,0,0,0.6)',border:'none',borderRadius:'50%',color:'rgba(255,255,255,0.7)',cursor:'pointer',fontSize:'11px'}}>✕</button>
                      </div>
                    )}
                    <div style={{display:'flex',gap:'8px'}}>
                      <label style={{flex:1,cursor:'pointer'}}><input type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={handlePhotoSelect}/><div style={{...S.btnGhost,display:'block',padding:'10px'}}>📷 Camera</div></label>
                      <label style={{flex:1,cursor:'pointer'}}><input type="file" accept="image/*" style={{display:'none'}} onChange={handlePhotoSelect}/><div style={{...S.btnGhost,display:'block',padding:'10px'}}>🖼 Gallery</div></label>
                    </div>
                  </div>
                  <button onClick={handleSave} disabled={saving} style={{...S.btn,opacity:saving?0.5:1}}>{saving?'Saving...':editItem?'✓ Update':'+ Add Item'}</button>
                </div>
              )}

              {/* ── CONFIG ── */}
              {tab==='config'&&(
                <div style={{display:'flex',flexDirection:'column',gap:'16px',marginTop:'8px'}}>
                  {[{type:'category',label:'Categories',list:invCategories,icon:'🏷️'},{type:'location',label:'Locations',list:invLocations,icon:'📍'}].map(({type,label,list,icon})=>(
                    <div key={type} style={S.card}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
                        <p style={{fontWeight:900,fontSize:'13px',color:'#fff',margin:0}}>{icon} {label}</p>
                        <button onClick={()=>{setConfigModal(type);setConfigNew('');}}
                          style={{background:'rgba(251,191,36,0.15)',border:'1px solid rgba(251,191,36,0.3)',color:'#fbbf24',borderRadius:'8px',padding:'5px 12px',fontSize:'11px',fontWeight:900,cursor:'pointer'}}>
                          + Add
                        </button>
                      </div>
                      <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                        {list.map(val=>(
                          <div key={val} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',background:'rgba(255,255,255,0.04)',borderRadius:'10px'}}>
                            <span style={{fontSize:'13px',color:'rgba(255,255,255,0.8)'}}>{val}</span>
                            <button onClick={()=>handleRemoveConfig(type,val)}
                              style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',color:'#f87171',borderRadius:'6px',padding:'3px 10px',fontSize:'10px',fontWeight:900,cursor:'pointer'}}>
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── USAGE MODAL ── */}
      {usageModal&&(
        <div style={{position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'flex-end',justifyContent:'center',background:'rgba(0,0,0,0.65)',backdropFilter:'blur(6px)'}} onClick={()=>setUsageModal(null)}>
          <div style={{width:'100%',maxWidth:'420px',background:'#1a1030',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'24px 24px 0 0',padding:'24px 24px 40px',display:'flex',flexDirection:'column',gap:'14px'}} onClick={e=>e.stopPropagation()}>
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
            <button onClick={handleUsageLog} disabled={saving} style={{...S.btn,opacity:saving?0.5:1}}>{saving?'Saving...':'Confirm'}</button>
          </div>
        </div>
      )}

      {/* ── TRANSFER MODAL ── */}
      {transferModal&&(
        <div style={{position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'flex-end',justifyContent:'center',background:'rgba(0,0,0,0.65)',backdropFilter:'blur(6px)'}} onClick={()=>setTransferModal(null)}>
          <div style={{width:'100%',maxWidth:'420px',background:'#0f1a2e',border:'1px solid rgba(96,165,250,0.2)',borderRadius:'24px 24px 0 0',padding:'24px 24px 40px',display:'flex',flexDirection:'column',gap:'14px'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <p style={{fontWeight:900,fontSize:'14px',color:'#60a5fa',margin:0}}>📍 Transfer</p>
              <button onClick={()=>setTransferModal(null)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.3)',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <div style={{background:'rgba(96,165,250,0.07)',borderRadius:'12px',padding:'10px 14px',border:'1px solid rgba(96,165,250,0.15)'}}>
              <p style={{color:'#60a5fa',fontWeight:900,fontSize:'14px',margin:0}}>{transferModal.Item_Name}</p>
              <p style={{color:'rgba(255,255,255,0.4)',fontSize:'9px',margin:'2px 0 0'}}>From: {transferModal.Location||'—'}</p>
            </div>
            <div><label style={S.label}>New Location</label>
              <select value={transferLoc} onChange={e=>setTransferLoc(e.target.value)} style={S.input}>
                <option value="">— ရွေးပါ —</option>
                {invLocations.filter(l=>l!==transferModal.Location).map(loc=><option key={loc} value={loc}>{loc}</option>)}
              </select>
            </div>
            <div><label style={S.label}>Note</label><input value={transferNote} onChange={e=>setTransferNote(e.target.value)} placeholder="e.g. Moved for renovation" style={S.input}/></div>
            <button onClick={handleTransfer} disabled={saving||!transferLoc} style={{...S.btn,background:'#3b82f6',opacity:(saving||!transferLoc)?0.5:1}}>{saving?'Transferring...':'Confirm Transfer'}</button>
          </div>
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {detailModal&&(
        <div style={{position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'flex-end',justifyContent:'center',background:'rgba(0,0,0,0.7)',backdropFilter:'blur(6px)'}} onClick={()=>setDetailModal(null)}>
          <div style={{width:'100%',maxWidth:'480px',background:'#13131a',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'24px 24px 0 0',padding:'24px',maxHeight:'85dvh',overflowY:'auto',display:'flex',flexDirection:'column',gap:'14px'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <p style={{fontWeight:900,fontSize:'15px',color:'#fff',margin:0}}>{detailModal.Item_Name}</p>
              <button onClick={()=>setDetailModal(null)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.3)',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            {detailModal.Photo_URL&&<img src={detailModal.Photo_URL} alt="" style={{width:'100%',borderRadius:'12px',aspectRatio:'16/9',objectFit:'cover'}}/>}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
              {[
                ['Category',  detailModal.Category||'—'],
                ['Location',  detailModal.Location||'—'],
                ['Stock',     `${detailModal.Stock_Qty} ${detailModal.Unit}`],
                ['Min Stock', detailModal.Min_Stock||'—'],
                ['Unit Price',detailModal.Unit_Price?detailModal.Unit_Price+' ks':'—'],
                ['Condition', detailModal.Condition||'—'],
                detailModal.Is_Tool==='TRUE'&&['Serial No', detailModal.Serial_No||'—'],
                detailModal.Is_Tool==='TRUE'&&['Assigned To',detailModal.Assigned_To||'—'],
                detailModal.Is_Tool==='TRUE'&&['Warranty',   detailModal.Warranty_Until||'—'],
                detailModal.Is_Tool==='TRUE'&&['Purchased',  detailModal.Purchase_Date||'—'],
              ].filter(Boolean).map(([k,v])=>(
                <div key={k} style={{background:'rgba(255,255,255,0.04)',borderRadius:'10px',padding:'10px 12px'}}>
                  <p style={{fontSize:'9px',color:'rgba(255,255,255,0.3)',textTransform:'uppercase',margin:'0 0 3px'}}>{k}</p>
                  <p style={{fontSize:'13px',fontWeight:700,color:'#f1f5f9',margin:0}}>{v}</p>
                </div>
              ))}
            </div>
            <div>
              <p style={{fontSize:'10px',fontWeight:900,color:'rgba(255,255,255,0.35)',textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 10px'}}>History</p>
              {detailLoading?(
                <div style={{textAlign:'center',padding:'20px'}}><div style={{width:'20px',height:'20px',border:'2px solid rgba(255,255,255,0.1)',borderTop:'2px solid #fbbf24',borderRadius:'50%',animation:'spin 0.8s linear infinite',display:'inline-block'}}/></div>
              ):detailHistory.length===0?(
                <p style={{color:'rgba(255,255,255,0.2)',fontSize:'12px',textAlign:'center'}}>No history yet</p>
              ):detailHistory.map((l,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:i<detailHistory.length-1?'1px solid rgba(255,255,255,0.05)':'none'}}>
                  <div>
                    <span style={{fontSize:'11px',fontWeight:700,color:l.Action==='Transfer'?'#60a5fa':l.Action==='Damaged'?'#f87171':Number(l.Qty_Change)<0?'#f87171':'#34d399'}}>{l.Action}</span>
                    <span style={{fontSize:'10px',color:'rgba(255,255,255,0.3)',marginLeft:'6px'}}>{l.Done_By}</span>
                    {l.Note&&<p style={{fontSize:'9px',color:'rgba(255,255,255,0.2)',margin:'1px 0 0',fontStyle:'italic'}}>{l.Note}</p>}
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <p style={{fontSize:'12px',fontWeight:900,margin:0,color:l.Action==='Transfer'?'#60a5fa':Number(l.Qty_Change)<0?'#f87171':'#34d399'}}>
                      {l.Action==='Transfer'?'📍':Number(l.Qty_Change)>0?'+':''}{l.Action==='Transfer'?'':l.Qty_Change}
                    </p>
                    <p style={{fontSize:'9px',color:'rgba(255,255,255,0.25)',margin:0}}>{l.Date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PURCHASE REQUEST MODAL ── */}
      {requestModal&&(
        <div style={{position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'flex-end',justifyContent:'center',background:'rgba(0,0,0,0.65)',backdropFilter:'blur(6px)'}} onClick={()=>setRequestModal(null)}>
          <div style={{width:'100%',maxWidth:'420px',background:'#0a1a0f',border:'1px solid rgba(52,211,153,0.2)',borderRadius:'24px 24px 0 0',padding:'24px 24px 40px',display:'flex',flexDirection:'column',gap:'14px'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <p style={{fontWeight:900,fontSize:'14px',color:'#34d399',margin:0}}>🛒 Purchase Request</p>
              <button onClick={()=>setRequestModal(null)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.3)',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <div style={{background:'rgba(52,211,153,0.07)',borderRadius:'12px',padding:'10px 14px',border:'1px solid rgba(52,211,153,0.15)'}}>
              <p style={{color:'#34d399',fontWeight:900,fontSize:'14px',margin:0}}>{requestModal.Item_Name}</p>
              <p style={{color:'rgba(255,255,255,0.4)',fontSize:'9px',margin:'2px 0 0'}}>Current Stock: {requestModal.Stock_Qty} {requestModal.Unit}</p>
            </div>
            <div><label style={S.label}>Quantity Needed *</label>
              <input type="number" min="1" value={requestForm.qty} onChange={e=>setRequestForm(f=>({...f,qty:e.target.value}))} placeholder="0" style={S.input}/>
            </div>
            <div><label style={S.label}>Reason *</label>
              <input value={requestForm.reason} onChange={e=>setRequestForm(f=>({...f,reason:e.target.value}))} placeholder="e.g. Low stock, damaged items replaced" style={S.input}/>
            </div>
            <button onClick={handleRequest} disabled={saving} style={{...S.btn,background:'#10b981',opacity:saving?0.5:1}}>{saving?'Submitting...':'Submit Request'}</button>
          </div>
        </div>
      )}

      {/* ── ADD CONFIG MODAL ── */}
      {configModal&&(
        <div style={{position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.7)',backdropFilter:'blur(6px)',padding:'24px'}} onClick={()=>setConfigModal(null)}>
          <div style={{width:'100%',maxWidth:'340px',background:'#13131a',border:'1px solid rgba(251,191,36,0.2)',borderRadius:'20px',padding:'24px',display:'flex',flexDirection:'column',gap:'14px'}} onClick={e=>e.stopPropagation()}>
            <p style={{fontWeight:900,fontSize:'14px',color:'#fff',margin:0}}>{configModal==='category'?'🏷️ New Category':'📍 New Location'}</p>
            <input autoFocus value={configNew} onChange={e=>setConfigNew(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleAddConfig()} placeholder={configModal==='category'?'e.g. Medical':'e.g. Science Lab'} style={S.input}/>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={()=>setConfigModal(null)} style={{...S.btnGhost,flex:1,padding:'11px'}}>Cancel</button>
              <button onClick={handleAddConfig} disabled={!configNew.trim()||configSaving} style={{...S.btn,flex:1,padding:'11px',opacity:(!configNew.trim()||configSaving)?0.5:1}}>{configSaving?'Saving...':'Add'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}