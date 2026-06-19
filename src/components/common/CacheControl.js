"use client";
import { useState } from 'react';
import { CacheDB } from '@/lib/cache';

// ══════════════════════════════════════════════════════════════
//  CacheControl — Testing အတွက် Cache Clear Button
//  Management layout မှာ floating button အနေနဲ့ ထည့်ထားတယ်
//
//  Production မသွားခင် ဖျက်ချင်ရင် layout.js ကနေ import ဖြုတ်ရုံပဲ
// ══════════════════════════════════════════════════════════════

export default function CacheControl() {
  const [open,   setOpen]   = useState(false);
  const [status, setStatus] = useState([]);
  const [msg,    setMsg]    = useState('');

  const flash = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 2500);
  };

  const loadStatus = async () => {
    try {
      const s = await CacheDB.status();
      setStatus(s);
    } catch {
      setStatus([]);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    loadStatus();
  };

  const clearAll = async () => {
    await CacheDB.clearAll();
    await loadStatus();
    flash('✅ Cache အကုန် ဖျက်ပြီး — Next call GAS ကို fresh ခေါ်မယ်');
  };

  const clearKey = async (key) => {
    await CacheDB.clear(key);
    await loadStatus();
    flash(`🗑️ "${key}" ဖျက်ပြီး`);
  };

  return (
    <>
      {/* ── Floating Button ── */}
      <button
        onClick={handleOpen}
        title="Cache Control (Testing)"
        style={{
          position: 'fixed',
          bottom: 80,      // bottom nav အပေါ်
          right: 16,
          zIndex: 9999,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'linear-gradient(135deg,#6B6BA8,#9E9ECA)',
          border: '2px solid rgba(255,255,255,0.3)',
          color: '#fff',
          fontSize: 18,
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(107,107,168,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        🗃️
      </button>

      {/* ── Panel ── */}
      {open && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          padding: '0 16px 80px',
        }} onClick={() => setOpen(false)}>
          <div
            style={{
              background: '#1A1830',
              border: '1px solid rgba(158,158,202,0.3)',
              borderRadius: 20,
              padding: '20px 20px 16px',
              width: '100%',
              maxWidth: 420,
              color: '#E2E2F0',
              fontFamily: 'system-ui,sans-serif',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 16 }}>
              <div>
                <p style={{ margin:0, fontSize:14, fontWeight:800, color:'#9E9ECA', letterSpacing:'0.08em' }}>
                  🗃️ CACHE CONTROL
                </p>
                <p style={{ margin:'2px 0 0', fontSize:9, color:'rgba(226,226,240,0.35)', textTransform:'uppercase', letterSpacing:'0.15em' }}>
                  Testing Mode
                </p>
              </div>
              <button onClick={() => setOpen(false)} style={{ background:'rgba(255,255,255,0.08)', border:'none', color:'#9E9ECA', borderRadius:8, padding:'4px 10px', cursor:'pointer', fontSize:12 }}>
                ✕
              </button>
            </div>

            {/* Flash message */}
            {msg && (
              <div style={{ background:'rgba(158,158,202,0.15)', border:'1px solid rgba(158,158,202,0.3)', borderRadius:10, padding:'8px 12px', marginBottom:12, fontSize:11, color:'#9E9ECA' }}>
                {msg}
              </div>
            )}

            {/* Clear All Button */}
            <button
              onClick={clearAll}
              style={{
                width: '100%',
                padding: '11px 16px',
                background: 'linear-gradient(135deg,#6B6BA8,#9E9ECA)',
                border: 'none',
                borderRadius: 12,
                color: '#fff',
                fontSize: 12,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                marginBottom: 14,
              }}
            >
              🗑️ Cache အကုန်ဖျက် (Full Refresh)
            </button>

            {/* Cache Status List */}
            <p style={{ margin:'0 0 8px', fontSize:9, color:'rgba(226,226,240,0.35)', textTransform:'uppercase', letterSpacing:'0.15em' }}>
              Cache Status ({status.length} keys)
            </p>

            {status.length === 0 ? (
              <div style={{ textAlign:'center', padding:'16px 0', fontSize:11, color:'rgba(226,226,240,0.3)' }}>
                Cache ဗလာ — GAS ကို fresh ခေါ်မယ်
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:240, overflowY:'auto' }}>
                {status.map((s) => (
                  <div key={s.key} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: s.valid ? 'rgba(158,158,202,0.08)' : 'rgba(239,68,68,0.08)',
                    border: `1px solid ${s.valid ? 'rgba(158,158,202,0.2)' : 'rgba(239,68,68,0.2)'}`,
                    borderRadius: 8,
                    padding: '7px 10px',
                    gap: 8,
                  }}>
                    {/* Status dot */}
                    <div style={{
                      width: 7, height: 7, borderRadius:'50%', flexShrink:0,
                      background: s.valid ? '#4ade80' : '#f87171',
                    }}/>

                    {/* Key + expiry */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ margin:0, fontSize:10, fontWeight:700, color:'#E2E2F0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {s.key}
                      </p>
                      <p style={{ margin:0, fontSize:9, color: s.valid ? 'rgba(74,222,128,0.7)' : 'rgba(248,113,113,0.7)' }}>
                        {s.valid ? `${s.expiresIn} ကြာဦးမယ်` : 'Expired'}
                      </p>
                    </div>

                    {/* Clear single key */}
                    <button
                      onClick={() => clearKey(s.key)}
                      style={{ background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.25)', color:'#f87171', borderRadius:6, padding:'3px 8px', fontSize:9, cursor:'pointer', flexShrink:0 }}
                    >
                      ဖျက်
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Refresh status button */}
            <button
              onClick={loadStatus}
              style={{ marginTop:12, width:'100%', padding:'8px', background:'transparent', border:'1px solid rgba(158,158,202,0.2)', borderRadius:10, color:'rgba(226,226,240,0.45)', fontSize:10, cursor:'pointer', letterSpacing:'0.06em' }}
            >
              ↻ Status ပြန်စစ်
            </button>
          </div>
        </div>
      )}
    </>
  );
}
