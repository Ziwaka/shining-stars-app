"use client";
import { useState } from 'react';
import useLeaveData from '@/hooks/useLeaveData';
import DurationBadge from '@/components/leave/DurationBadge';
import { formatDateDisplay, formatMMDate } from '@/components/leave/DateHelpers';
import { WEB_APP_URL } from '@/lib/api';

const STATUS_STYLE = {
  Approved: { bg:'#dcfce7', color:'#16a34a', label:'✓ Approved'    },
  Rejected: { bg:'#fee2e2', color:'#dc2626', label:'✗ Rejected'    },
  AWOL:     { bg:'#fff7ed', color:'#ea580c', label:'🚫 AWOL'        },
  Pending:  { bg:'#fef3c7', color:'#d97706', label:'⏳ Pending'     },
};

export default function ApprovalPage() {
  const { allLeaves, pending, loading, fetchLeaves } = useLeaveData();
  const [proc, setProc]           = useState(false);
  const [remark, setRemark]         = useState('');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [histTab, setHistTab]     = useState('detail');
  const [user] = useState(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
    }
    return null;
  });

  const getPersonHistory = (leave) => {
    if (!leave || !allLeaves?.length) return [];
    return allLeaves
      .filter(l => {
        const sameId   = leave.User_ID && l.User_ID === leave.User_ID;
        const sameName = leave.Name && l.Name === leave.Name;
        const isThisOne = formatMMDate(l.Start_Date) === formatMMDate(leave.Start_Date)
                       && l.Name === leave.Name && l.Status === 'Pending';
        return (sameId || sameName) && !isThisOne;
      })
      .sort((a, b) => (b.Start_Date > a.Start_Date ? 1 : -1));
  };

  const handleAction = async (leave, status) => {
    if (!user?.Name) return alert('Session Expired.');
    const statusLabel = status === 'Approved' ? 'Approve' : status === 'Rejected' ? 'Decline (Reject)' : 'ခွင့်မဲ့ ပျက်ကွက် (AWOL) မှတ်တမ်းတင်';
    
    let warningMsg = '';
    if (status === 'Approved') {
      // Check for duplicate approved leave (same user, same dates, already approved)
      const existingApproved = allLeaves.find(l => 
        l.User_ID === leave.User_ID &&
        l.Status === 'Approved' &&
        formatMMDate(l.Start_Date) === formatMMDate(leave.Start_Date) &&
        formatMMDate(l.End_Date || l.Start_Date) === formatMMDate(leave.End_Date || leave.Start_Date) &&
        l._rowIndex !== leave._rowIndex
      );
      if (existingApproved) {
        warningMsg = `⚠️ ဤအသုံးပြုသူအတွက် ဤရက်များတွင် ခွင့် Approved ဖြစ်ပြီးသားရှိသည်။\n\nဆက်လက်လုပ်ဆောင်မည်လား။`;
        if (!confirm(warningMsg)) return;
      }
      
      // Check for excessive approved leaves in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentApproved = allLeaves.filter(l => 
        l.User_ID === leave.User_ID &&
        l.Status === 'Approved' &&
        new Date(l.Start_Date) >= thirtyDaysAgo
      ).length;
      if (recentApproved >= 3) {
        const extraWarning = `\n\n❗ သတိပြုရန် - ဤအသုံးပြုသူသည် လွန်ခဲ့သော ၃၀ ရက်အတွင်း ${recentApproved} ကြိမ် ခွင့် Approved ရှိပြီးဖြစ်သည်။ ဆက်လက်လုပ်ဆောင်မည်လား။`;
        if (!confirm(warningMsg + extraWarning)) return;
      }
    }
    
    setProc(true);
    try {
      const res = await fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action:     'updateLeave',
          rowIndex:   leave._rowIndex,
          userId:     leave.User_ID,
          name:       leave.Name,
          startDate:  formatMMDate(leave.Start_Date),
          status,
          remark:     remark.trim() || '-',
          approvedBy: user?.Name || user?.username || "Management",
          userRole:   'management',
        }),
      });
      const r = await res.json();
      if (r.success) {
        setRemark('');
        setSelectedLeave(null);
        fetchLeaves();
        alert(`Leave ${statusLabel} ပြုလုပ်ပြီးပါပြီ။`);
      } else {
        alert('မအောင်မြင်ပါ: ' + r.message);
      }
    } catch {
      alert('Network Error — GAS connection စစ်ဆေးပါ');
    } finally {
      setProc(false);
    }
  };

  const openDetail = (leave) => {
    setSelectedLeave(leave);
    setHistTab('detail');
  };

  if (loading || proc) {
    return (
      <div style={{ minHeight:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize:24, color:'#d97706' }}>⌛</span>
        <span style={{ marginLeft:8, color:'#94a3b8', fontSize:13 }}>
          {proc ? 'Processing...' : 'Loading...'}
        </span>
      </div>
    );
  }

  const history = selectedLeave ? getPersonHistory(selectedLeave) : [];

  return (
    <div style={{ paddingBottom:24 }}>

      {selectedLeave && (
        <div style={{
          position:'fixed', inset:0, zIndex:9999,
          background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)',
          display:'flex', alignItems:'center', justifyContent:'center', padding:16,
        }} onClick={() => setSelectedLeave(null)}>
          <div style={{
            background:'#fff', borderRadius:24,
            width:'100%', maxWidth:520,
            maxHeight:'92vh', display:'flex', flexDirection:'column',
            boxShadow:'0 8px 40px rgba(0,0,0,0.25)',
          }} onClick={e => e.stopPropagation()}>

            <div style={{
              padding:'16px 20px 0',
              borderBottom:'1px solid #f1f5f9',
              flexShrink:0,
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div>
                  <p style={{ fontSize:9, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.15em', fontWeight:900, margin:'0 0 2px' }}>
                    Leave Request
                  </p>
                  <p style={{ fontSize:17, fontWeight:900, color:'#1a1a2e', margin:0 }}>
                    {selectedLeave.Name}
                  </p>
                  <p style={{ fontSize:10, color:'#64748b', margin:'2px 0 0' }}>
                    {selectedLeave.User_Type} · {selectedLeave.Leave_Type} · {selectedLeave.Total_Days || 1} day(s)
                  </p>
                </div>
                <button onClick={() => setSelectedLeave(null)} style={{
                  background:'#f1f5f9', border:'none', borderRadius:10,
                  width:34, height:34, cursor:'pointer', fontSize:14, color:'#64748b',
                }}>✕</button>
              </div>

              <div style={{ display:'flex', gap:4, paddingBottom:0 }}>
                {[
                  { id:'detail',  label:'📋 အချက်အလက်' },
                  { id:'history', label:`📅 Leave History (${history.length})` },
                ].map(t => (
                  <button key={t.id} onClick={() => setHistTab(t.id)} style={{
                    border:'none', cursor:'pointer',
                    padding:'8px 14px', borderRadius:'10px 10px 0 0',
                    fontSize:11, fontWeight:900,
                    background: histTab===t.id ? '#fff' : 'transparent',
                    color:      histTab===t.id ? '#1a1a2e' : '#94a3b8',
                    borderBottom: histTab===t.id ? '2px solid #4338ca' : '2px solid transparent',
                  }}>{t.label}</button>
                ))}
              </div>
            </div>

            <div style={{ overflowY:'auto', flex:1, padding:'16px 20px' }}>

              {histTab === 'detail' && (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

                  <div style={{ background:'#f8fafc', borderRadius:16, padding:'14px 16px' }}>
                    <p style={{ fontSize:9, fontWeight:900, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>
                      တိုင်ကြားသူ
                    </p>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, fontSize:12 }}>
                      <div>
                        <p style={{ fontSize:9, color:'#94a3b8' }}>ID</p>
                        <p style={{ fontWeight:700 }}>{selectedLeave.User_ID || '-'}</p>
                      </div>
                      {selectedLeave.User_Type === 'STUDENT' ? (
                        <div>
                          <p style={{ fontSize:9, color:'#94a3b8' }}>Grade / Section</p>
                          <p style={{ fontWeight:700 }}>{selectedLeave.Grade || '-'} {selectedLeave.Section || ''}</p>
                        </div>
                      ) : (
                        <div>
                          <p style={{ fontSize:9, color:'#94a3b8' }}>ရာထူး</p>
                          <p style={{ fontWeight:700 }}>{selectedLeave.Position || 'Staff'}</p>
                        </div>
                      )}
                      {selectedLeave.Phone && (
                        <div>
                          <p style={{ fontSize:9, color:'#94a3b8' }}>ဖုန်း</p>
                          <p style={{ fontWeight:700 }}>📞 {selectedLeave.Phone}</p>
                        </div>
                      )}
                      {selectedLeave.Reporter_Name && selectedLeave.Reporter_Name !== '-' && (
                        <div>
                          <p style={{ fontSize:9, color:'#94a3b8' }}>သတင်းပို့သူ</p>
                          <p style={{ fontWeight:700 }}>{selectedLeave.Reporter_Name} ({selectedLeave.Relationship || ''})</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ background:'#f8fafc', borderRadius:16, padding:'14px 16px' }}>
                    <p style={{ fontSize:9, fontWeight:900, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>
                      ခွင့်အချက်အလက်
                    </p>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, fontSize:12, marginBottom:10 }}>
                      <div>
                        <p style={{ fontSize:9, color:'#94a3b8' }}>ခွင့်အမျိုးအစား</p>
                        <p style={{ fontWeight:700 }}>{selectedLeave.Leave_Type || '-'}</p>
                      </div>
                      <div>
                        <p style={{ fontSize:9, color:'#94a3b8' }}>ရက်ရေ</p>
                        <p style={{ fontWeight:700 }}>{selectedLeave.Total_Days || 1} ရက်</p>
                      </div>
                      <div>
                        <p style={{ fontSize:9, color:'#94a3b8' }}>စတင်ရက်</p>
                        <p style={{ fontWeight:700 }}>{formatDateDisplay(selectedLeave.Start_Date)}</p>
                      </div>
                      <div>
                        <p style={{ fontSize:9, color:'#94a3b8' }}>ပြီးဆုံးရက်</p>
                        <p style={{ fontWeight:700 }}>{formatDateDisplay(selectedLeave.End_Date || selectedLeave.Start_Date)}</p>
                      </div>
                    </div>
                    <div>
                      <p style={{ fontSize:9, color:'#94a3b8', marginBottom:4 }}>အကြောင်းပြချက်</p>
                      <p style={{ fontSize:12, fontStyle:'italic', background:'#fff', padding:'10px 12px', borderRadius:10, border:'1px solid #e2e8f0', color:'#334155' }}>
                        "{selectedLeave.Reason || '—'}"
                      </p>
                    </div>
                    {selectedLeave.Remark && selectedLeave.Remark !== '-' && selectedLeave.Remark !== '' && (
                      <div style={{ marginTop:8 }}>
                        <p style={{ fontSize:9, color:'#94a3b8', marginBottom:4 }}>မှတ်ချက်</p>
                        <p style={{ fontSize:12, background:'#fffbeb', padding:'10px 12px', borderRadius:10, border:'1px solid #fde68a' }}>
                          ✏️ {selectedLeave.Remark}
                        </p>
                      </div>
                    )}
                  </div>

                  {history.length > 0 && (
                    <div style={{
                      background: history.filter(h=>h.Status==='Approved').length >= 3 ? '#fff7ed' : '#f0fdf4',
                      border: `1px solid ${history.filter(h=>h.Status==='Approved').length >= 3 ? '#fed7aa' : '#bbf7d0'}`,
                      borderRadius:12, padding:'10px 14px',
                      display:'flex', alignItems:'center', gap:10,
                    }}>
                      <span style={{ fontSize:20 }}>
                        {(history.filter(h=>h.Status==='Approved').length + history.filter(h=>h.Status==='AWOL').length) >= 5 ? '⚠️' :
                         (history.filter(h=>h.Status==='Approved').length + history.filter(h=>h.Status==='AWOL').length) >= 3 ? '🟡' : history.filter(h=>h.Status==='AWOL').length > 0 ? '🚫' : '✅'}
                      </span>
                      <div>
                        <p style={{ fontSize:11, fontWeight:900, color:'#1a1a2e', margin:0 }}>
                          ယခင် leave history: {history.length} ကြိမ်
                        </p>
                        <p style={{ fontSize:10, color:'#64748b', margin:'2px 0 0' }}>
                          Approved: {history.filter(h=>h.Status==='Approved').length} ·
                          Rejected: {history.filter(h=>h.Status==='Rejected').length} ·
                          AWOL: {history.filter(h=>h.Status==='AWOL').length} ·
                          Pending: {history.filter(h=>h.Status==='Pending').length}
                          &nbsp;— History tab တွင် အသေးစိတ် ကြည့်ပါ
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {histTab === 'history' && (
                <div>
                  {history.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'30px 0', color:'#94a3b8', fontSize:13 }}>
                      ယခင် leave record မရှိပါ
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {history.map((h, i) => {
                        const st = STATUS_STYLE[h.Status] || STATUS_STYLE.Pending;
                        return (
                          <div key={i} style={{
                            background: h.Status==='AWOL' ? '#fff7ed' : '#f8fafc',
                            borderRadius:14,
                            padding:'12px 14px',
                            borderLeft: `4px solid ${st.color}`,
                          }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                              <div>
                                <span style={{ fontSize:11, fontWeight:900, color:'#1a1a2e' }}>
                                  {h.Leave_Type || 'Leave'}
                                </span>
                                <span style={{
                                  fontSize:9, fontWeight:900,
                                  background: st.bg, color: st.color,
                                  padding:'2px 8px', borderRadius:20,
                                  marginLeft:6,
                                }}>{st.label}</span>
                              </div>
                              <span style={{ fontSize:10, color:'#94a3b8', fontWeight:600 }}>
                                {h.Total_Days || 1} day(s)
                              </span>
                            </div>
                            <p style={{ fontSize:10, color:'#64748b', margin:'0 0 4px' }}>
                              📅 {formatDateDisplay(h.Start_Date)}
                              {h.End_Date && formatMMDate(h.End_Date) !== formatMMDate(h.Start_Date)
                                ? ` → ${formatDateDisplay(h.End_Date)}`
                                : ''}
                            </p>
                            {h.Reason && h.Reason !== '-' && (
                              <p style={{ fontSize:11, color:'#475569', fontStyle:'italic', margin:'0 0 4px' }}>
                                "{h.Reason}"
                              </p>
                            )}
                            {h.Remark && h.Remark !== '-' && h.Remark !== '' && (
                              <p style={{ fontSize:10, color:'#b45309', background:'#fffbeb', borderRadius:6, padding:'3px 8px', display:'inline-block', margin:'0 0 4px' }}>
                                ✏️ {h.Remark}
                              </p>
                            )}
                            {h.Approved_By && h.Approved_By !== '-' && h.Status === 'Approved' && (
                              <p style={{ fontSize:9, color:'#94a3b8', margin:'4px 0 0' }}>
                                ✓ Approved by {h.Approved_By}
                              </p>
                            )}
                            {h.Status === 'AWOL' && (
                              <div style={{ marginTop:8, paddingTop:8, borderTop:'1px solid rgba(234,88,12,0.15)' }}>
                                <p style={{ fontSize:9, color:'#ea580c', fontWeight:700, margin:'0 0 6px' }}>
                                  ⚠️ ခွင့်မဲ့ ပျက်ကွက် — ပြန်တိုင်ခွင့် ပေးမည်လား?
                                </p>
                                <button
                                  onClick={() => {
                                    const el = document.querySelector('[data-submit-tab]');
                                    if (el) el.click();
                                    else alert('Submit tab သို့ သွားပြီး Back Date mode ဖွင့်ကာ\n' + (selectedLeave?.Name||'') + ' ၏ ' + h.Start_Date + ' မှ ' + (h.End_Date||h.Start_Date) + ' အတွက် ပြန်တိုင်ပေးပါ');
                                  }}
                                  style={{
                                    fontSize:9, fontWeight:900, color:'#ea580c',
                                    background:'rgba(234,88,12,0.08)',
                                    border:'1px solid rgba(234,88,12,0.25)',
                                    borderRadius:20, padding:'4px 12px', cursor:'pointer',
                                  }}>
                                  🕐 Back Date ခွင့်တိုင် →
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedLeave.Status === 'Pending' && (
              <div style={{ padding:'14px 20px', borderTop:'1px solid #f1f5f9', flexShrink:0 }}>
                <div style={{ marginBottom:10 }}>
                  <label style={{ display:'block', fontSize:'9px', fontWeight:900, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:'5px' }}>
                    ✏️ Remark (optional) — Approve/Decline မတိုင်မီ မှတ်ချက်ရေးနိုင်သည်
                  </label>
                  <input
                    value={remark}
                    onChange={e => setRemark(e.target.value)}
                    placeholder="ဥပမာ: ဆရာဝန်ထောက်ခံစာ တင်ရန် — leave approved conditionally"
                    style={{ width:'100%', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:'9px 12px', fontSize:12, outline:'none', boxSizing:'border-box', color:'#334155' }}
                  />
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button
                    onClick={() => handleAction(selectedLeave, 'Approved')}
                    style={{ flex:1, padding:'12px 8px', background:'#22c55e', color:'#fff', border:'none', borderRadius:12, fontSize:12, fontWeight:900, cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.03em' }}>
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleAction(selectedLeave, 'Rejected')}
                    style={{ flex:1, padding:'12px 8px', background:'#ef4444', color:'#fff', border:'none', borderRadius:12, fontSize:12, fontWeight:900, cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.03em' }}>
                    ✗ Decline
                  </button>
                  <button
                    onClick={() => handleAction(selectedLeave, 'AWOL')}
                    style={{ flex:1, padding:'12px 8px', background:'#ea580c', color:'#fff', border:'none', borderRadius:12, fontSize:12, fontWeight:900, cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.03em' }}>
                    🚫 AWOL
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {pending.length === 0 ? (
        <div style={{
          padding:'60px 20px', textAlign:'center',
          background:'#fff', borderRadius:20,
          border:'2px dashed #e2e8f0',
        }}>
          <p style={{ fontSize:40, marginBottom:8 }}>🥂</p>
          <p style={{ fontSize:18, fontWeight:900, color:'#94a3b8' }}>All Caught Up!</p>
          <p style={{ fontSize:12, color:'#cbd5e1', marginTop:4 }}>Pending leave မရှိပါ</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {pending.map((l, i) => (
            <div
              key={i}
              onClick={() => openDetail(l)}
              style={{
                background:'#fff', borderRadius:20,
                borderLeft:'6px solid #f59e0b',
                boxShadow:'0 2px 12px rgba(0,0,0,0.07)',
                padding:'14px 16px', cursor:'pointer',
                transition:'box-shadow 0.15s',
              }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <div>
                  <p style={{ fontSize:14, fontWeight:900, color:'#1a1a2e', margin:'0 0 2px' }}>{l.Name}</p>
                  <p style={{ fontSize:10, color:'#64748b', margin:0 }}>
                    {l.User_Type} · {l.Leave_Type}
                  </p>
                </div>
                <div style={{ textAlign:'right' }}>
                  <p style={{ fontSize:18, fontWeight:900, color:'#1a1a2e', margin:0 }}>{l.Total_Days || 1}d</p>
                  <p style={{ fontSize:9, color:'#94a3b8' }}>days</p>
                </div>
              </div>

              <p style={{ fontSize:10, color:'#64748b', marginBottom:6 }}>
                📅 {formatDateDisplay(l.Start_Date)}
                {l.End_Date && formatMMDate(l.End_Date) !== formatMMDate(l.Start_Date)
                  ? ` → ${formatDateDisplay(l.End_Date)}`
                  : ''}
              </p>

              <p style={{
                fontSize:11, fontStyle:'italic', color:'#475569',
                background:'#f8fafc', padding:'8px 10px', borderRadius:10,
                marginBottom:10,
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
              }}>
                "{l.Reason || '—'}"
              </p>

              <div style={{ display:'flex', gap:6, justifyContent:'flex-end', flexWrap:'wrap' }}>
                <button
                  onClick={e => { e.stopPropagation(); handleAction(l, 'Approved'); }}
                  style={{ padding:'6px 14px', background:'#22c55e', color:'#fff', border:'none', borderRadius:20, fontSize:10, fontWeight:900, cursor:'pointer', textTransform:'uppercase' }}>
                  ✓ Approve
                </button>
                <button
                  onClick={e => { e.stopPropagation(); handleAction(l, 'Rejected'); }}
                  style={{ padding:'6px 14px', background:'#ef4444', color:'#fff', border:'none', borderRadius:20, fontSize:10, fontWeight:900, cursor:'pointer', textTransform:'uppercase' }}>
                  ✗ Decline
                </button>
                <button
                  onClick={e => { e.stopPropagation(); handleAction(l, 'AWOL'); }}
                  style={{ padding:'6px 14px', background:'#ea580c', color:'#fff', border:'none', borderRadius:20, fontSize:10, fontWeight:900, cursor:'pointer', textTransform:'uppercase' }}>
                  🚫 AWOL
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}