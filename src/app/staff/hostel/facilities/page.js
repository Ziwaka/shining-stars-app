"use client";
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

// ============================================================
// HOSTEL INVENTORY MANAGEMENT SYSTEM - COMPLETE VERSION
// Features: Camera capture, Auto-suggest, Stock tracking, Usage logs, Relocation, Config
// ============================================================

// ── 1. CONSTANTS ───────────────────────────────────────────

const CATEGORIES = [
  'Furniture', 'Bedding', 'Electronics', 'Cleaning', 
  'Kitchen', 'Bathroom', 'Sports', 'Stationery', 
  'Uniform', 'Footwear', 'Medical', 'Other'
];

const UNITS = [
  'Pcs', 'Set', 'Box', 'Roll', 'Bottle', 
  'Pack', 'Kg', 'Liter', 'Pair', 'Dozen'
];

const ACTION_TYPES = {
  USE: 'Use',
  RESTOCK: 'Restock',
  INSPECT: 'Condition Check',
  TRANSFER: 'Transfer'  // NEW: Relocation action
};

const EMPTY_FORM = {
  Hostel_Name: '',
  Item_Name: '',
  Category: 'Furniture',
  Unit: 'Pcs',
  Stock_Qty: '',
  Min_Stock: '2',
  Good_Condition: '',
  Damaged: '0',
  Need_Repair: '0',
  Unit_Price: '',
  Location: '',
  Serial_No: '',
  Brand: '',
  Model: '',
  Purchase_Date: '',
  Warranty_Until: '',
  Supplier: '',
  Note: '',
  Photo_URL: ''
};

// ── 2. UTILITY FUNCTIONS ───────────────────────────────────

const formatDate = (d) => {
  if (!d) return '-';
  try {
    const match = String(d).match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return String(d);
    const [, yyyy, mm, dd] = match;
    return `${dd}/${mm}/${yyyy}`;
  } catch { 
    return String(d); 
  }
};

const formatCurrency = (amount) => {
  if (!amount || isNaN(amount)) return '-';
  return new Intl.NumberFormat('my-MM', {
    style: 'currency',
    currency: 'MMK',
    minimumFractionDigits: 0
  }).format(amount);
};

const calculateTotalValue = (items) => {
  return items.reduce((sum, item) => {
    const qty = Number(item.Stock_Qty) || 0;
    const price = Number(item.Unit_Price) || 0;
    return sum + (qty * price);
  }, 0);
};

// ── 3. STYLES ─────────────────────────────────────────────

const styles = {
  page: { 
    display: 'flex', 
    flexDirection: 'column', 
    height: '100dvh', 
    overflow: 'hidden', 
    background: '#0f0a1e', 
    color: '#fff', 
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  header: { 
    zIndex: 40, 
    background: 'rgba(15,10,30,0.97)', 
    backdropFilter: 'blur(12px)', 
    borderBottom: '1px solid rgba(255,255,255,0.07)', 
    padding: '12px 16px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  card: { 
    background: 'rgba(255,255,255,0.05)', 
    border: '1px solid rgba(255,255,255,0.1)', 
    borderRadius: '16px', 
    padding: '16px' 
  },
  cardHL: { 
    background: 'rgba(255,255,255,0.05)', 
    border: '1px solid rgba(251,191,36,0.3)', 
    borderRadius: '16px', 
    padding: '16px' 
  },
  input: { 
    width: '100%', 
    background: 'rgba(255,255,255,0.06)', 
    border: '1px solid rgba(255,255,255,0.12)', 
    borderRadius: '12px', 
    padding: '10px 14px', 
    color: '#fff', 
    fontSize: '13px', 
    outline: 'none',
    boxSizing: 'border-box'
  },
  select: { 
    width: '100%', 
    background: 'rgba(15,10,30,0.9)', 
    border: '1px solid rgba(255,255,255,0.12)', 
    borderRadius: '12px', 
    padding: '10px 14px', 
    color: '#fff', 
    fontSize: '13px', 
    outline: 'none',
    boxSizing: 'border-box'
  },
  label: { 
    display: 'block', 
    fontSize: '9px', 
    color: 'rgba(255,255,255,0.35)', 
    textTransform: 'uppercase', 
    letterSpacing: '0.1em', 
    marginBottom: '6px' 
  },
  btn: { 
    background: '#fbbf24', 
    color: '#0f172a', 
    border: 'none', 
    borderRadius: '14px', 
    padding: '13px', 
    fontSize: '13px', 
    fontWeight: 900, 
    width: '100%', 
    cursor: 'pointer', 
    textTransform: 'uppercase', 
    letterSpacing: '0.06em' 
  },
  btnSm: { 
    background: 'rgba(255,255,255,0.08)', 
    color: 'rgba(255,255,255,0.5)', 
    border: '1px solid rgba(255,255,255,0.1)', 
    borderRadius: '8px', 
    padding: '6px 12px', 
    fontSize: '10px', 
    fontWeight: 900, 
    cursor: 'pointer', 
    flex: 1, 
    textAlign: 'center' 
  },
  btnRed: { 
    background: 'rgba(239,68,68,0.15)', 
    color: '#f87171', 
    border: '1px solid rgba(239,68,68,0.2)', 
    borderRadius: '8px', 
    padding: '6px 12px', 
    fontSize: '10px', 
    fontWeight: 900, 
    cursor: 'pointer', 
    flex: 1, 
    textAlign: 'center' 
  },
  btnGreen: { 
    background: 'rgba(52,211,153,0.15)', 
    color: '#34d399', 
    border: '1px solid rgba(52,211,153,0.2)', 
    borderRadius: '8px', 
    padding: '6px 12px', 
    fontSize: '10px', 
    fontWeight: 900, 
    cursor: 'pointer', 
    flex: 1, 
    textAlign: 'center' 
  },
  tabOn: { 
    background: '#fbbf24', 
    color: '#0f172a', 
    border: 'none', 
    borderRadius: '10px', 
    padding: '7px 14px', 
    fontSize: '10px', 
    fontWeight: 900, 
    textTransform: 'uppercase', 
    cursor: 'pointer', 
    whiteSpace: 'nowrap' 
  },
  tabOff: { 
    background: 'rgba(255,255,255,0.06)', 
    color: 'rgba(255,255,255,0.4)', 
    border: 'none', 
    borderRadius: '10px', 
    padding: '7px 14px', 
    fontSize: '10px', 
    fontWeight: 900, 
    textTransform: 'uppercase', 
    cursor: 'pointer', 
    whiteSpace: 'nowrap' 
  },
  pill: (color) => ({ 
    background: `${color}18`, 
    color, 
    border: `1px solid ${color}40`, 
    borderRadius: '99px', 
    padding: '2px 8px', 
    fontSize: '9px', 
    fontWeight: 900, 
    display: 'inline-block' 
  })
};

// ── 4. MODAL COMPONENT ──────────────────────────────────────

const Modal = ({ onClose, children, title }) => (
  <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div style={{background:'#1a1030',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'24px 24px 0 0',padding:'20px 20px 32px',width:'100%',maxWidth:'480px',maxHeight:'85vh',overflowY:'auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
        <p style={{fontWeight:900,fontSize:'14px',margin:0}}>{title}</p>
        <button onClick={onClose} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',fontSize:'20px',cursor:'pointer',padding:'0 4px'}}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

// ── 5. MAIN COMPONENT ──────────────────────────────────────

export default function HostelInventoryPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('dashboard');
  
  // ── CONFIG STATE (NEW) ──
  const [invCategories, setInvCategories] = useState(CATEGORIES);
  const [invLocations, setInvLocations] = useState([]); // Will be populated from API
  
  // Filters
  const [search, setSearch] = useState('');
  const [hostelFilter, setHostelFilter] = useState('All');
  const [catFilter, setCatFilter] = useState('All');
  const [conditionFilter, setConditionFilter] = useState('All');
  
  // Form states
  const [form, setForm] = useState(EMPTY_FORM);
  const [editItem, setEditItem] = useState(null);
  const [usageModal, setUsageModal] = useState(null);
  const [transferModal, setTransferModal] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoBase64, setPhotoBase64] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [usageForm, setUsageForm] = useState({ 
    qty: '', 
    action: 'Use', 
    good: '', 
    damaged: '', 
    need_repair: '', 
    note: '',
    toHostel: ''
  });
  const [transferForm, setTransferForm] = useState({
    newLocation: '',
    note: ''
  });
  
  // ── CONFIG MODAL (NEW) ──
  const [configModal, setConfigModal] = useState(null);
  const [configNew, setConfigNew] = useState('');
  const [configSaving, setConfigSaving] = useState(false);
  
  // Auto-suggest states
  const [itemSuggestions, setItemSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  
  const [msg, setMsg] = useState(null);
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStock: 0,
    needRepair: 0,
    damaged: 0
  });

  // ── 6. AUTHENTICATION ────────────────────────────────────

  useEffect(() => {
    const saved = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!saved) { 
      router.push('/login'); 
      return; 
    }
    
    try {
      const u = JSON.parse(saved);
      if (!u.Can_Manage_Hostel && u.userRole !== 'management') { 
        router.push('/staff'); 
        return; 
      }
      setUser(u);
      fetchAll();
    } catch (error) {
      router.push('/login');
    }
  }, []);

  // ── 7. DATA FETCHING ────────────────────────────

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching from:', WEB_APP_URL);
      
      const [invRes, logRes] = await Promise.all([
        fetch(WEB_APP_URL, { 
          method: 'POST', 
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'getHostelInventory' }) 
        }),
        fetch(WEB_APP_URL, { 
          method: 'POST', 
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'getHostelInventoryLog' }) 
        }),
      ]);
      
      const invText = await invRes.text();
      const logText = await logRes.text();
      
      console.log('Inventory response received');
      
      const inv = JSON.parse(invText);
      const log = JSON.parse(logText);
      
      if (inv.success) {
        setItems(inv.data || []);
        const hs = inv.hostels || [];
        setHostels(hs);
        if (hs.length) {
          setForm(f => ({ ...f, Hostel_Name: f.Hostel_Name || hs[0] }));
        }
        
        // Extract unique locations for config
        const locations = [...new Set((inv.data || []).map(i => i.Location).filter(Boolean))];
        setInvLocations(locations);
        
        // Calculate statistics
        const totalValue = calculateTotalValue(inv.data || []);
        const lowStock = (inv.data || []).filter(i => 
          Number(i.Stock_Qty || 0) <= Number(i.Min_Stock || 0) && Number(i.Min_Stock || 0) > 0
        ).length;
        const needRepair = (inv.data || []).reduce((sum, i) => sum + (Number(i.Need_Repair || 0)), 0);
        const damaged = (inv.data || []).reduce((sum, i) => sum + (Number(i.Damaged || 0)), 0);
        
        setStats({
          totalItems: inv.data?.length || 0,
          totalValue,
          lowStock,
          needRepair,
          damaged
        });
      } else {
        setError(inv.message || 'Failed to load inventory');
      }
      
      if (log.success) {
        setLogs(log.data || []);
      }
      
    } catch (error) {
      console.error('Fetch error:', error);
      setError(error.message || 'Network error - please check connection');
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3500);
  };

  // ── 8. AUTO-SUGGEST ─────────────────────────────────────

  const handleItemNameChange = (e) => {
    const value = e.target.value;
    setForm({ ...form, Item_Name: value });
    
    if (value.length >= 2) {
      const suggestions = items
        .filter(item => 
          item.Item_Name?.toLowerCase().includes(value.toLowerCase()) &&
          item.Hostel_Name === form.Hostel_Name
        )
        .map(item => ({
          name: item.Item_Name,
          category: item.Category,
          unit: item.Unit,
          id: item.Item_ID
        }))
        .filter((item, index, self) => 
          index === self.findIndex(i => i.name === item.name)
        )
        .slice(0, 5);
      
      setItemSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
      setItemSuggestions([]);
    }
  };

  const selectSuggestion = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setForm({
      ...form,
      Item_Name: suggestion.name,
      Category: suggestion.category,
      Unit: suggestion.unit
    });
    setShowSuggestions(false);
  };

  // ── 9. CAMERA FUNCTIONS ─────────────────────────────────

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraStream(stream);
        setShowCamera(true);
      }
    } catch (error) {
      showMsg('Camera access denied', 'error');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const base64 = canvas.toDataURL('image/jpeg', 0.7);
      
      setPhotoBase64(base64);
      setPhotoPreview(base64);
      setForm(f => ({ ...f, Photo_URL: base64 }));
      
      stopCamera();
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      showMsg('Photo size should be less than 2MB', 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setPhotoBase64(base64String);
      setPhotoPreview(base64String);
      setForm(f => ({ ...f, Photo_URL: base64String }));
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoBase64('');
    setPhotoPreview('');
    setForm(f => ({ ...f, Photo_URL: '' }));
  };

  // Clean up camera
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // ── 10. CONFIG FUNCTIONS (NEW) ──────────────────────────

  const handleAddConfig = async () => {
    const val = configNew.trim();
    if (!val) return;
    
    // Since we don't have a backend API for config yet, we'll just update local state
    if (configModal === 'category') {
      if (invCategories.includes(val)) {
        showMsg('Category already exists', 'error');
        return;
      }
      setInvCategories([...invCategories, val]);
      showMsg(`Category "${val}" added`);
    } else if (configModal === 'location') {
      if (invLocations.includes(val)) {
        showMsg('Location already exists', 'error');
        return;
      }
      setInvLocations([...invLocations, val]);
      showMsg(`Location "${val}" added`);
    }
    
    setConfigModal(null);
    setConfigNew('');
  };

  const handleRemoveConfig = (type, val) => {
    if (!confirm(`Remove "${val}"?`)) return;
    
    if (type === 'category') {
      setInvCategories(invCategories.filter(c => c !== val));
    } else if (type === 'location') {
      setInvLocations(invLocations.filter(l => l !== val));
    }
    
    showMsg(`"${val}" removed`);
  };

  // ── 11. DATA PROCESSING ───────────────────────────────────

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const searchLower = search.toLowerCase();
      const matchesSearch = !search || 
        (item.Item_Name || '').toLowerCase().includes(searchLower) ||
        (item.Location || '').toLowerCase().includes(searchLower) ||
        (item.Serial_No || '').toLowerCase().includes(searchLower);
      
      const matchesHostel = hostelFilter === 'All' || item.Hostel_Name === hostelFilter;
      const matchesCategory = catFilter === 'All' || item.Category === catFilter;
      
      let matchesCondition = true;
      if (conditionFilter === 'Low Stock') {
        matchesCondition = Number(item.Stock_Qty || 0) <= Number(item.Min_Stock || 0) && Number(item.Min_Stock || 0) > 0;
      } else if (conditionFilter === 'Need Repair') {
        matchesCondition = Number(item.Need_Repair || 0) > 0;
      } else if (conditionFilter === 'Damaged') {
        matchesCondition = Number(item.Damaged || 0) > 0;
      }
      
      return matchesSearch && matchesHostel && matchesCategory && matchesCondition;
    });
  }, [items, search, hostelFilter, catFilter, conditionFilter]);

  const itemsByHostel = useMemo(() => {
    return items.reduce((acc, item) => {
      const hostel = item.Hostel_Name || 'Unknown';
      if (!acc[hostel]) {
        acc[hostel] = {
          items: [],
          totalValue: 0,
          itemCount: 0
        };
      }
      acc[hostel].items.push(item);
      acc[hostel].itemCount++;
      acc[hostel].totalValue += (Number(item.Stock_Qty || 0) * Number(item.Unit_Price || 0));
      return acc;
    }, {});
  }, [items]);

  // ── 12. CRUD OPERATIONS ─────────────────────────

  const handleSave = async () => {
    if (!form.Item_Name?.trim()) {
      return showMsg('Item Name ဖြည့်ပါ', 'error');
    }
    if (!form.Hostel_Name) {
      return showMsg('Hostel ရွေးပါ', 'error');
    }

    setSaving(true);
    try {
      const action = editItem ? 'updateHostelItem' : 'addHostelItem';
      const payload = {
        ...form,
        Updated_By: user?.Name || '',
        Updated_At: new Date().toISOString()
      };
      
      if (editItem) payload.Item_ID = editItem.Item_ID;
      
      const res = await fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, ...payload })
      });
      
      const text = await res.text();
      const result = JSON.parse(text);
      
      if (result.success) {
        showMsg('Item saved successfully');
        setForm({ ...EMPTY_FORM, Hostel_Name: form.Hostel_Name });
        setPhotoPreview('');
        setPhotoBase64('');
        setEditItem(null);
        setSelectedSuggestion(null);
        setTab('list');
        fetchAll();
      } else {
        showMsg(result.message || 'Error saving item', 'error');
      }
    } catch (error) {
      showMsg('Network error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUsage = async () => {
    if (usageForm.action !== ACTION_TYPES.INSPECT && 
        (!usageForm.qty || isNaN(Number(usageForm.qty)))) {
      return showMsg('Qty ထည့်ပါ', 'error');
    }

    setSaving(true);
    
    const qtyChange = usageForm.action === ACTION_TYPES.RESTOCK 
      ? Math.abs(Number(usageForm.qty || 0)) 
      : -Math.abs(Number(usageForm.qty || 0));

    try {
      const payload = {
        action: 'logHostelUsage',
        Item_ID: usageModal.Item_ID,
        Item_Name: usageModal.Item_Name,
        Hostel_Name: usageModal.Hostel_Name,
        Qty_Change: usageForm.action === ACTION_TYPES.INSPECT ? 0 : qtyChange,
        Action: usageForm.action,
        Done_By: user?.Name || '',
        Note: usageForm.note,
      };

      if (usageForm.good !== '') payload.Good_Condition = usageForm.good;
      if (usageForm.damaged !== '') payload.Damaged = usageForm.damaged;
      if (usageForm.need_repair !== '') payload.Need_Repair = usageForm.need_repair;

      const res = await fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      
      const text = await res.text();
      const result = JSON.parse(text);
      
      if (result.success) {
        showMsg(result.message);
        setUsageModal(null);
        setUsageForm({ qty: '', action: 'Use', good: '', damaged: '', need_repair: '', note: '', toHostel: '' });
        fetchAll();
      } else {
        showMsg(result.message || 'Error', 'error');
      }
    } catch (error) {
      showMsg('Network error', 'error');
    } finally {
      setSaving(false);
    }
  };

  // NEW: Handle relocation (transfer)
  const handleTransfer = async () => {
    if (!transferForm.newLocation) {
      return showMsg('New location ရွေးပါ', 'error');
    }

    setSaving(true);
    
    try {
      // 1. Update item location
      const updateRes = await fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'updateHostelItem',
          Item_ID: transferModal.Item_ID,
          Location: transferForm.newLocation,
          Updated_By: user?.Name || ''
        })
      });
      
      const updateText = await updateRes.text();
      const updateResult = JSON.parse(updateText);
      
      if (!updateResult.success) {
        throw new Error(updateResult.message || 'Failed to update location');
      }
      
      // 2. Log the transfer
      const logRes = await fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'logHostelUsage',
          Item_ID: transferModal.Item_ID,
          Item_Name: transferModal.Item_Name,
          Hostel_Name: transferModal.Hostel_Name,
          Qty_Change: 0,
          Action: ACTION_TYPES.TRANSFER,
          Done_By: user?.Name || user?.username || '',
          Note: `Moved to ${transferForm.newLocation}${transferForm.note ? ': ' + transferForm.note : ''}`
        })
      });
      
      const logText = await logRes.text();
      const logResult = JSON.parse(logText);
      
      if (logResult.success) {
        showMsg('Item relocated successfully ✓');
        setTransferModal(null);
        setTransferForm({ newLocation: '', note: '' });
        fetchAll();
      } else {
        throw new Error(logResult.message || 'Failed to log transfer');
      }
    } catch (error) {
      showMsg(error.message || 'Error during transfer', 'error');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setForm({ ...EMPTY_FORM, ...item });
    setEditItem(item);
    setPhotoPreview(item.Photo_URL || '');
    setPhotoBase64(item.Photo_URL || '');
    setSelectedSuggestion({ name: item.Item_Name });
    setTab('add');
  };

  // ── 13. LOADING STATE ───────────────────────────────────

  if (loading) return (
    <div style={styles.page}>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #fbbf24', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ marginTop: '16px', color: '#fbbf24' }}>Loading inventory...</p>
      </div>
    </div>
  );

  // ── 14. ERROR STATE ─────────────────────────────────────

  if (error) return (
    <div style={styles.page}>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', padding: '20px' }}>
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px', padding: '24px', maxWidth: '400px', textAlign: 'center' }}>
          <p style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</p>
          <h2 style={{ color: '#ef4444', fontSize: '18px', fontWeight: 900, marginBottom: '8px' }}>Data Fetch Failed</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '20px' }}>{error}</p>
          <button 
            onClick={fetchAll}
            style={{ background: '#fbbf24', color: '#000', border: 'none', borderRadius: '12px', padding: '12px 24px', fontSize: '13px', fontWeight: 900, cursor: 'pointer', marginRight: '10px' }}
          >
            Try Again
          </button>
          <button 
            onClick={() => router.push('/staff/hostel')}
            style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '12px 24px', fontSize: '13px', fontWeight: 900, cursor: 'pointer' }}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );

  // ── 15. RENDER ───────────────────────────────────────────

  const TABS = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'list', label: `📋 Items (${items.length})` },
    { id: 'add', label: editItem ? '✏️ Edit' : '➕ Add' },
    { id: 'log', label: '📝 Activity Log' },
    { id: 'config', label: '⚙️ Config' }  // NEW: Config tab
  ];

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        select option { background: #1a1030; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Header */}
      <div style={styles.header}>
        <button 
          onClick={() => router.push('/staff/hostel')} 
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '14px' }}
        >
          ← Back
        </button>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 900, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
            📦 Hostel Inventory
          </p>
          <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Asset Management
          </p>
        </div>
        <button 
          onClick={fetchAll} 
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '18px' }}
        >
          ↻
        </button>
      </div>

      {/* Toast Message */}
      {msg && (
        <div style={{
          position: 'fixed',
          top: '72px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 60,
          padding: '8px 20px',
          borderRadius: '999px',
          fontSize: '12px',
          fontWeight: 900,
          color: '#fff',
          background: msg.type === 'error' ? '#ef4444' : '#10b981',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          whiteSpace: 'nowrap',
          maxWidth: '90%',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', padding: '12px 16px 0', overflowX: 'auto', scrollbarWidth: 'none' }} className="no-scrollbar">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              if (t.id === 'add' && !editItem) {
                setForm({ ...EMPTY_FORM, Hostel_Name: hostels[0] || '' });
                setPhotoPreview('');
                setPhotoBase64('');
                setEditItem(null);
                setSelectedSuggestion(null);
                setShowSuggestions(false);
              }
            }}
            style={tab === t.id ? styles.tabOn : styles.tabOff}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '80px' }}>
        <div style={{ padding: '12px 16px' }}>
          
          {/* ── DASHBOARD TAB ── */}
          {tab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* KPI Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div style={{ ...styles.card, padding: '16px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#60a5fa' }}>{stats.totalItems}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Total Items</div>
                </div>
                <div style={{ ...styles.card, padding: '16px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#34d399' }}>
                    {new Intl.NumberFormat('en-US', { notation: 'compact' }).format(stats.totalValue)} K
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Total Value</div>
                </div>
                <div style={{ ...styles.card, padding: '16px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: stats.lowStock > 0 ? '#f87171' : '#34d399' }}>
                    {stats.lowStock}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Low Stock</div>
                </div>
                <div style={{ ...styles.card, padding: '16px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: stats.needRepair > 0 ? '#fbbf24' : '#34d399' }}>
                    {stats.needRepair}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Need Repair</div>
                </div>
              </div>

              {/* Per Hostel Summary */}
              <div style={styles.card}>
                <p style={{ ...styles.label, marginBottom: '12px', fontSize: '11px' }}>HOSTEL SUMMARY</p>
                {Object.entries(itemsByHostel).map(([hostel, data]) => (
                  <div key={hostel} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 900, fontSize: '13px', color: '#fbbf24' }}>{hostel}</span>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{data.itemCount} items</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${(data.itemCount / stats.totalItems) * 100}%`, 
                        background: '#fbbf24',
                        borderRadius: '2px'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ITEMS LIST TAB ── */}
          {tab === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Filters */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="🔍 Search items..."
                  style={{ ...styles.input, flex: 2, minWidth: '150px' }}
                />
                <select
                  value={hostelFilter}
                  onChange={e => setHostelFilter(e.target.value)}
                  style={{ ...styles.select, flex: 1 }}
                >
                  <option value="All">All Hostels</option>
                  {hostels.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <select
                  value={catFilter}
                  onChange={e => setCatFilter(e.target.value)}
                  style={{ ...styles.select, flex: 1 }}
                >
                  <option value="All">All Categories</option>
                  {invCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  value={conditionFilter}
                  onChange={e => setConditionFilter(e.target.value)}
                  style={{ ...styles.select, flex: 1 }}
                >
                  <option value="All">All Conditions</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Need Repair">Need Repair</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>

              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', margin: '0 0 4px' }}>
                {filteredItems.length} items found
              </p>

              {/* Items List */}
              {filteredItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.2)' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📦</div>
                  <p>No items found</p>
                  <button onClick={() => setTab('add')} style={{ ...styles.btn, width: 'auto', marginTop: '16px', padding: '10px 24px' }}>
                    Add New Item
                  </button>
                </div>
              ) : (
                filteredItems.map((item, index) => {
                  const stock = Number(item.Stock_Qty || 0);
                  const minStock = Number(item.Min_Stock || 0);
                  const isLowStock = minStock > 0 && stock <= minStock;
                  
                  return (
                    <div key={index} style={{ 
                      ...styles.card, 
                      borderLeft: `4px solid ${
                        isLowStock ? '#ef4444' : 
                        Number(item.Need_Repair) > 0 ? '#fbbf24' : 
                        Number(item.Damaged) > 0 ? '#f87171' : 
                        'rgba(255,255,255,0.1)'
                      }`
                    }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        {item.Photo_URL && (
                          <div style={{ width: '60px', height: '60px', flexShrink: 0 }}>
                            <img 
                              src={item.Photo_URL} 
                              alt={item.Item_Name}
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.1)'
                              }} 
                            />
                          </div>
                        )}
                        
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                                <p style={{ fontWeight: 900, fontSize: '14px', color: '#fff', margin: 0 }}>{item.Item_Name}</p>
                                <span style={{ fontSize: '8px', padding: '2px 8px', borderRadius: '99px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                                  {item.Category}
                                </span>
                              </div>
                              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                                {item.Hostel_Name} {item.Location && ` · 📍${item.Location}`}
                              </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontWeight: 900, fontSize: '20px', color: isLowStock ? '#ef4444' : '#fff', margin: 0 }}>
                                {stock}
                              </p>
                              <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>{item.Unit}</p>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => {
                                setUsageModal(item);
                                setUsageForm({
                                  qty: '',
                                  action: ACTION_TYPES.USE,
                                  good: String(item.Good_Condition || ''),
                                  damaged: String(item.Damaged || ''),
                                  need_repair: String(item.Need_Repair || ''),
                                  note: '',
                                  toHostel: ''
                                });
                              }}
                              style={{ ...styles.btnSm }}
                            >
                              Update
                            </button>
                            <button
                              onClick={() => {
                                setTransferModal(item);
                                setTransferForm({ newLocation: '', note: '' });
                              }}
                              style={{ ...styles.btnSm }}
                            >
                              📦 Relocate
                            </button>
                            <button
                              onClick={() => startEdit(item)}
                              style={{ ...styles.btnSm }}
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── ADD/EDIT TAB ── */}
          {tab === 'add' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={styles.card}>
                <p style={{ ...styles.label, marginBottom: '12px' }}>HOSTEL *</p>
                <select
                  value={form.Hostel_Name}
                  onChange={e => setForm({ ...form, Hostel_Name: e.target.value })}
                  style={styles.select}
                >
                  <option value="">Select Hostel</option>
                  {hostels.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div style={{ ...styles.card, position: 'relative' }}>
                <p style={{ ...styles.label, marginBottom: '12px' }}>ITEM NAME *</p>
                <input
                  value={form.Item_Name}
                  onChange={handleItemNameChange}
                  onFocus={() => {
                    if (form.Item_Name?.length >= 2) {
                      setShowSuggestions(itemSuggestions.length > 0);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  placeholder="e.g. Bed, Chair, Fan"
                  style={styles.input}
                />
                
                {showSuggestions && itemSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '16px',
                    right: '16px',
                    background: '#1a1030',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    marginTop: '4px',
                    zIndex: 10,
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {itemSuggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        onMouseDown={() => selectSuggestion(suggestion)}
                        style={{
                          padding: '10px 14px',
                          borderBottom: idx < itemSuggestions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                          cursor: 'pointer'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ fontWeight: 900, fontSize: '13px', color: '#fff' }}>{suggestion.name}</div>
                        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>
                          {suggestion.category} · {suggestion.unit}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedSuggestion && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    background: 'rgba(52,211,153,0.1)',
                    border: '1px solid rgba(52,211,153,0.2)',
                    borderRadius: '8px',
                    fontSize: '10px',
                    color: '#34d399'
                  }}>
                    ✓ Using existing item: {selectedSuggestion.name}
                  </div>
                )}
              </div>

              <div style={styles.card}>
                <p style={{ ...styles.label, marginBottom: '12px' }}>CATEGORY & UNIT</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={styles.label}>Category</label>
                    <select
                      value={form.Category}
                      onChange={e => setForm({ ...form, Category: e.target.value })}
                      style={styles.select}
                    >
                      {invCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={styles.label}>Unit</label>
                    <select
                      value={form.Unit}
                      onChange={e => setForm({ ...form, Unit: e.target.value })}
                      style={styles.select}
                    >
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div style={styles.card}>
                <p style={{ ...styles.label, marginBottom: '12px' }}>QUANTITY & CONDITION</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={styles.label}>Stock Quantity *</label>
                    <input
                      type="number"
                      value={form.Stock_Qty}
                      onChange={e => setForm({ ...form, Stock_Qty: e.target.value })}
                      placeholder="0"
                      style={styles.input}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Min Stock Alert</label>
                    <input
                      type="number"
                      value={form.Min_Stock}
                      onChange={e => setForm({ ...form, Min_Stock: e.target.value })}
                      placeholder="2"
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ ...styles.label, color: '#34d399' }}>Good ✓</label>
                    <input
                      type="number"
                      value={form.Good_Condition}
                      onChange={e => setForm({ ...form, Good_Condition: e.target.value })}
                      placeholder="0"
                      style={styles.input}
                    />
                  </div>
                  <div>
                    <label style={{ ...styles.label, color: '#f87171' }}>Damaged ✗</label>
                    <input
                      type="number"
                      value={form.Damaged}
                      onChange={e => setForm({ ...form, Damaged: e.target.value })}
                      placeholder="0"
                      style={styles.input}
                    />
                  </div>
                  <div>
                    <label style={{ ...styles.label, color: '#fbbf24' }}>Repair 🔧</label>
                    <input
                      type="number"
                      value={form.Need_Repair}
                      onChange={e => setForm({ ...form, Need_Repair: e.target.value })}
                      placeholder="0"
                      style={styles.input}
                    />
                  </div>
                </div>
              </div>

              <div style={styles.card}>
                <p style={{ ...styles.label, marginBottom: '12px' }}>PHOTO</p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  style={{ display: 'none' }}
                />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{ ...styles.btnSm, padding: '12px', background: '#3b82f6', color: '#fff' }}
                  >
                    📁 Choose File
                  </button>
                  <button
                    onClick={showCamera ? stopCamera : startCamera}
                    style={{ ...styles.btnSm, padding: '12px', background: showCamera ? '#ef4444' : '#10b981', color: '#fff' }}
                  >
                    {showCamera ? '⏹️ Stop Camera' : '📸 Open Camera'}
                  </button>
                </div>
                
                {showCamera && (
                  <div style={{ position: 'relative', marginBottom: '12px' }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      style={{
                        width: '100%',
                        borderRadius: '12px',
                        border: '2px solid rgba(255,255,255,0.1)'
                      }}
                    />
                    <button
                      onClick={capturePhoto}
                      style={{
                        position: 'absolute',
                        bottom: '16px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        padding: '10px 24px',
                        background: '#fbbf24',
                        color: '#000',
                        border: 'none',
                        borderRadius: '999px',
                        fontWeight: 900,
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      📸 Capture
                    </button>
                  </div>
                )}
                
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                
                {photoPreview && !showCamera && (
                  <div style={{ textAlign: 'center' }}>
                    <img 
                      src={photoPreview} 
                      alt="Preview" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '200px', 
                        borderRadius: '12px',
                        border: '2px solid rgba(255,255,255,0.1)',
                        marginBottom: '8px'
                      }} 
                    />
                    <button 
                      onClick={removePhoto}
                      style={{ ...styles.btnSm, background: '#ef4444', color: '#fff' }}
                    >
                      Remove Photo
                    </button>
                  </div>
                )}
              </div>

              <div style={styles.card}>
                <p style={{ ...styles.label, marginBottom: '12px' }}>ADDITIONAL DETAILS</p>
                
                <div style={{ marginBottom: '12px' }}>
                  <label style={styles.label}>Location / Room</label>
                  <input
                    value={form.Location}
                    onChange={e => setForm({ ...form, Location: e.target.value })}
                    placeholder="e.g. Room 101"
                    style={styles.input}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={styles.label}>Unit Price (Ks)</label>
                    <input
                      type="number"
                      value={form.Unit_Price}
                      onChange={e => setForm({ ...form, Unit_Price: e.target.value })}
                      placeholder="0"
                      style={styles.input}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Serial No</label>
                    <input
                      value={form.Serial_No}
                      onChange={e => setForm({ ...form, Serial_No: e.target.value })}
                      placeholder="Optional"
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '12px' }}>
                  <label style={styles.label}>Notes</label>
                  <input
                    value={form.Note}
                    onChange={e => setForm({ ...form, Note: e.target.value })}
                    placeholder="Additional information"
                    style={styles.input}
                  />
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                style={{ ...styles.btn, opacity: saving ? 0.5 : 1 }}
              >
                {saving ? 'Saving...' : editItem ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          )}

          {/* ── LOG TAB ── */}
          {tab === 'log' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {logs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.2)' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📝</div>
                  <p>No activity logs yet</p>
                </div>
              ) : (
                logs.slice(0, 50).map((log, index) => (
                  <div key={index} style={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <p style={{ fontWeight: 900, fontSize: '13px', color: '#fff', margin: 0 }}>{log.Item_Name}</p>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{formatDate(log.Date)}</span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                      <span style={styles.pill(log.Action === ACTION_TYPES.TRANSFER ? '#60a5fa' : 'rgba(255,255,255,0.3)')}>
                        {log.Action}
                      </span> · {log.Hostel_Name} · by {log.Done_By}
                    </p>
                    {log.Note && (
                      <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', margin: '4px 0 0', fontStyle: 'italic' }}>
                        "{log.Note}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── CONFIG TAB (NEW) ── */}
          {tab === 'config' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Categories */}
              <div style={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <p style={{ fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, color: '#fbbf24' }}>
                    🏷️ Categories
                  </p>
                  <button
                    onClick={() => { setConfigModal('category'); setConfigNew(''); }}
                    style={styles.btnSm}
                  >
                    + Add
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {invCategories.map(cat => (
                    <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '99px', padding: '4px 10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 900 }}>{cat}</span>
                      <button
                        onClick={() => handleRemoveConfig('category', cat)}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '12px', padding: '0 2px' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Locations */}
              <div style={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <p style={{ fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, color: '#60a5fa' }}>
                    📍 Locations
                  </p>
                  <button
                    onClick={() => { setConfigModal('location'); setConfigNew(''); }}
                    style={styles.btnSm}
                  >
                    + Add
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {invLocations.map(loc => (
                    <div key={loc} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '99px', padding: '4px 10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 900 }}>{loc}</span>
                      <button
                        onClick={() => handleRemoveConfig('location', loc)}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '12px', padding: '0 2px' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Usage Modal */}
      {usageModal && (
        <Modal title={`📊 Update: ${usageModal.Item_Name}`} onClose={() => setUsageModal(null)}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {[ACTION_TYPES.USE, ACTION_TYPES.RESTOCK, ACTION_TYPES.INSPECT].map(action => (
              <button
                key={action}
                onClick={() => setUsageForm({ ...usageForm, action })}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  background: usageForm.action === action ? '#fbbf24' : 'rgba(255,255,255,0.1)',
                  color: usageForm.action === action ? '#000' : '#fff',
                  fontWeight: 900,
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                {action}
              </button>
            ))}
          </div>

          {usageForm.action !== ACTION_TYPES.INSPECT && (
            <div style={{ marginBottom: '16px' }}>
              <label style={styles.label}>Quantity *</label>
              <input
                type="number"
                value={usageForm.qty}
                onChange={e => setUsageForm({ ...usageForm, qty: e.target.value })}
                placeholder="Enter quantity"
                style={styles.input}
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
            <div>
              <label style={{ ...styles.label, color: '#34d399' }}>Good</label>
              <input
                type="number"
                value={usageForm.good}
                onChange={e => setUsageForm({ ...usageForm, good: e.target.value })}
                placeholder="0"
                style={styles.input}
              />
            </div>
            <div>
              <label style={{ ...styles.label, color: '#f87171' }}>Damaged</label>
              <input
                type="number"
                value={usageForm.damaged}
                onChange={e => setUsageForm({ ...usageForm, damaged: e.target.value })}
                placeholder="0"
                style={styles.input}
              />
            </div>
            <div>
              <label style={{ ...styles.label, color: '#fbbf24' }}>Repair</label>
              <input
                type="number"
                value={usageForm.need_repair}
                onChange={e => setUsageForm({ ...usageForm, need_repair: e.target.value })}
                placeholder="0"
                style={styles.input}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={styles.label}>Note</label>
            <input
              value={usageForm.note}
              onChange={e => setUsageForm({ ...usageForm, note: e.target.value })}
              placeholder="Optional note"
              style={styles.input}
            />
          </div>

          <button
            onClick={handleUsage}
            disabled={saving}
            style={{ ...styles.btn, opacity: saving ? 0.5 : 1 }}
          >
            {saving ? 'Saving...' : 'Submit'}
          </button>
        </Modal>
      )}

      {/* Transfer (Relocation) Modal */}
      {transferModal && (
        <Modal title="📦 Relocate Item" onClose={() => setTransferModal(null)}>
          <p style={{ fontWeight: 900, fontSize: '14px', marginBottom: '4px' }}>{transferModal.Item_Name}</p>
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginBottom: '14px' }}>
            Current location: {transferModal.Location || 'Not set'}
          </p>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={styles.label}>New Location *</label>
            <select
              value={transferForm.newLocation}
              onChange={e => setTransferForm({ ...transferForm, newLocation: e.target.value })}
              style={styles.select}
            >
              <option value="">— Select —</option>
              {invLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
              {hostels.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={styles.label}>Note (optional)</label>
            <input
              value={transferForm.note}
              onChange={e => setTransferForm({ ...transferForm, note: e.target.value })}
              placeholder="Reason for relocation..."
              style={styles.input}
            />
          </div>

          <button
            onClick={handleTransfer}
            disabled={saving}
            style={{ ...styles.btn, opacity: saving ? 0.5 : 1 }}
          >
            {saving ? 'Saving...' : 'Confirm Relocation'}
          </button>
        </Modal>
      )}

      {/* Config Add Modal */}
      {configModal && (
        <Modal title={configModal === 'category' ? 'Add Category' : 'Add Location'} onClose={() => setConfigModal(null)}>
          <div style={{ marginBottom: '16px' }}>
            <label style={styles.label}>Name</label>
            <input
              value={configNew}
              onChange={e => setConfigNew(e.target.value)}
              placeholder={configModal === 'category' ? 'e.g. Electronics' : 'e.g. Room 101'}
              style={styles.input}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleAddConfig(); }}
            />
          </div>
          <button
            onClick={handleAddConfig}
            disabled={configSaving}
            style={{ ...styles.btn, opacity: configSaving ? 0.5 : 1 }}
          >
            {configSaving ? 'Adding...' : 'Add'}
          </button>
        </Modal>
      )}
    </div>
  );
}