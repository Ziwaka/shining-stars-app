"use client";
import { useState } from 'react';
import DurationBadge from './DurationBadge';
import { formatDateDisplay } from './DateHelpers';

const STATUS_COLOR = {
  Approved: { bg:'#dcfce7', color:'#16a34a', label:'✓ Approved' },
  Rejected:  { bg:'#fee2e2', color:'#dc2626', label:'✗ Rejected' },
  AWOL:      { bg:'#fff7ed', color:'#ea580c', label:'🚫 AWOL'    },
  Pending:   { bg:'#fef3c7', color:'#d97706', label:'⏳ Pending' },
};

export default function UserDetailModal({ user, onClose }) {
  const [tab, setTab] = useState('history');
  if (!user) return null;

  const reasons = (user.reasons || []).slice().sort((a,b) => (b.start > a.start ? 1 : -1));
  const approved = reasons.filter(r => r.status === 'Approved');
  const awol     = reasons.filter(r => r.status === 'AWOL');
  const rejected = reasons.filter(r => r.status === 'Rejected');
  const pending  = reasons.filter(r => r.status === 'Pending' || !r.status);

  const leaveTypeMap = user.leaveTypes || {};
  const totalDays     = user.totalDays     || 0;
  const consecutive   = user.consecutiveMax || 0;
  const weekCount     = user.weekCount     || 0;
  const monthCount    = user.monthCount    || 0;

  const TABS = [
    { id:'history',  label:`📋 Leave History (${reasons.length})` },
    { id:'stats',    label:'📊 Stats' },
  ];

  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={onClose}
    >
      <div
        style={{ background:'#fff', borderRadius:24, width:'100%', maxWidth:540, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 16px 60px rgba(0,0,0,0.25)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding:'18px 20px 0', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
            <div>
              <div style={{ display:'flex', gap:6, marginBottom:6, flexWrap:'wrap' }}>
                <span style={{ fontSize:9, fontWeight:900, padding:'3px 10px', borderRadius:20, background: user.type==='STUDENT'?'#e0e7ff':'#fef3c7', color: user.type==='STUDENT'?'#4338ca':'#b45309', textTransform:'uppercase' }}>
                  {user.type==='STUDENT'?'🎓 Student':'👔 Staff'}
                </span>
                {user.grade && (
                  <span style={{ fontSize:9, fontWeight:900, padding:'3px 10px', borderRadius:20, background:'#f0f9ff', color:'#0369a1' }}>
                    Grade {user.grade}{user.section ? ` · ${user.section}` : ''}
                  </span>
                )}
                {awol.length > 0 && (
                  <span style={{ fontSize:9, fontWeight:900, padding:'3px 10px', borderRadius:20, background:'#fff7ed', color:'#ea580c' }}>
                    🚫 {awol.length} AWOL
                  </span>
                )}
              </div>
              <h2 style={{ fontSize:20, fontWeight:900, color:'#0f172a', margin:0, letterSpacing:'-0.02em' }}>{user.name}</h2>
              <p style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>ID: {user.id}</p>
            </div>
            <button onClick={onClose} style={{ background:'#f1f5f9', border:'none', borderRadius:10, width:34, height:34, cursor:'pointer', fontSize:14, color:'#64748b' }}>✕</button>
          </div>

          {/* Quick stats row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:12 }}>
            {[
              { v:totalDays,   label:'Total Days', color:'#d97706' },
              { v:consecutive, label:'Max Consec',  color:'#dc2626' },
              { v:weekCount,   label:'This Week',   color:'#0369a1' },
              { v:monthCount,  label:'This Month',  color:'#7c3aed' },
            ].map((s,i)=>(
              <div key={i} style={{ background:'#f8fafc', borderRadius:10, padding:'8px 4px', textAlign:'center' }}>
                <p style={{ fontSize:20, fontWeight:900, color:s.color, margin:0 }}>{s.v}</p>
                <p style={{ fontSize:8, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', margin:0 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:4, borderBottom:'1px solid #f1f5f9', paddingBottom:0 }}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{
                border:'none', cursor:'pointer', padding:'8px 14px', borderRadius:'10px 10px 0 0',
                fontSize:11, fontWeight:900, background:'transparent',
                color: tab===t.id?'#0f172a':'#94a3b8',
                borderBottom: tab===t.id?'2px solid #0f172a':'2px solid transparent',
              }}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY:'auto', flex:1, padding:'14px 20px 20px' }}>

          {/* ── HISTORY TAB ── */}
          {tab==='history' && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {reasons.length === 0 ? (
                <p style={{ textAlign:'center', padding:'40px 0', color:'#cbd5e1', fontSize:13, fontStyle:'italic' }}>
                  Leave history မရှိပါ
                </p>
              ) : reasons.map((r,i)=>{
                const st = STATUS_COLOR[r.status] || STATUS_COLOR.Pending;
                return (
                  <div key={i} style={{ background:'#f8fafc', borderRadius:14, padding:'12px 14px', borderLeft:`4px solid ${st.color}`, background: r.status==='AWOL'?'#fff8f5':'#f8fafc' }}>
                    {/* Row 1: type + status + date */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                        <span style={{ fontSize:11, fontWeight:900, color:'#1e293b' }}>{r.type||'Leave'}</span>
                        <span style={{ fontSize:9, fontWeight:900, background:st.bg, color:st.color, padding:'2px 8px', borderRadius:20 }}>{st.label}</span>
                      </div>
                      <span style={{ fontSize:10, color:'#94a3b8', fontWeight:600, whiteSpace:'nowrap' }}>
                        {r.end && r.end !== r.start
                          ? `${formatDateDisplay(r.start)} → ${formatDateDisplay(r.end)}`
                          : formatDateDisplay(r.start)}
                      </span>
                    </div>
                    {/* Reason */}
                    {r.text && r.text !== '-' && (
                      <p style={{ fontSize:11, color:'#475569', fontStyle:'italic', margin:'0 0 4px', lineHeight:1.5 }}>"{r.text}"</p>
                    )}
                    {/* Remark */}
                    {r.remark && r.remark !== '-' && r.remark !== '' && (
                      <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'4px 10px', fontSize:10, color:'#b45309', fontWeight:700, display:'flex', gap:4, alignItems:'flex-start' }}>
                        <span>✏️</span><span>{r.remark}</span>
                      </div>
                    )}
                    {/* Attachment */}
                    {r.attachment && r.attachment !== '-' && (
                      <a href={r.attachment} target="_blank" rel="noopener noreferrer" style={{ fontSize:9, color:'#0ea5e9', fontWeight:700, display:'inline-block', marginTop:4 }}>📎 Attachment</a>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── STATS TAB ── */}
          {tab==='stats' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {/* By Status */}
              <div style={{ background:'#f8fafc', borderRadius:14, padding:'12px 14px' }}>
                <p style={{ fontSize:9, fontWeight:900, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>Status Breakdown</p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
                  {[
                    { label:'Approved', count:approved.length, color:'#16a34a', bg:'#dcfce7' },
                    { label:'AWOL',     count:awol.length,     color:'#ea580c', bg:'#fff7ed' },
                    { label:'Rejected', count:rejected.length, color:'#dc2626', bg:'#fee2e2' },
                    { label:'Pending',  count:pending.length,  color:'#d97706', bg:'#fef3c7' },
                  ].map((s,i)=>(
                    <div key={i} style={{ background:s.bg, borderRadius:10, padding:'8px 4px', textAlign:'center' }}>
                      <p style={{ fontSize:18, fontWeight:900, color:s.color, margin:0 }}>{s.count}</p>
                      <p style={{ fontSize:8, color:s.color, fontWeight:700, margin:0, textTransform:'uppercase' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* By Leave Type */}
              {Object.keys(leaveTypeMap).length > 0 && (
                <div style={{ background:'#f8fafc', borderRadius:14, padding:'12px 14px' }}>
                  <p style={{ fontSize:9, fontWeight:900, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>Leave Type Breakdown</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {Object.entries(leaveTypeMap).sort((a,b)=>b[1]-a[1]).map(([type,days],i)=>(
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:11, color:'#475569', flex:1, fontWeight:700 }}>{type}</span>
                        <div style={{ width:80, height:6, background:'#e2e8f0', borderRadius:99, overflow:'hidden' }}>
                          <div style={{ width:`${Math.min((days/totalDays)*100,100)}%`, height:'100%', background:'#6366f1', borderRadius:99 }}/>
                        </div>
                        <span style={{ fontSize:11, fontWeight:900, color:'#1e293b', width:30, textAlign:'right' }}>{days}d</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
