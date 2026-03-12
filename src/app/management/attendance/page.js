"use client";
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

// ── Myanmar date helpers ─────────────────────────────────────────────────────
const toMyanmarDate = (d = new Date()) =>
  d.toLocaleDateString('en-CA', { timeZone: 'Asia/Yangon' }); // YYYY-MM-DD

const displayDate = (str) => {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d} ${months[+m-1]} ${y}`;
};

const isToday = (str) => str === toMyanmarDate();

// ── Color system ─────────────────────────────────────────────────────────────
const STATUS_COLOR = {
  green:  { bg:'rgba(52,211,153,0.1)',  border:'rgba(52,211,153,0.35)',  text:'#34d399', label:'All Clear'  },
  yellow: { bg:'rgba(251,191,36,0.1)',  border:'rgba(251,191,36,0.35)',  text:'#fbbf24', label:'Pending'    },
  red:    { bg:'rgba(248,113,113,0.1)', border:'rgba(248,113,113,0.35)', text:'#f87171', label:'Rejected'   },
};

const LEAVE_STATUS_COLOR = {
  Approved: '#34d399',
  Pending:  '#fbbf24',
  Rejected: '#f87171',
};

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg:     '#07080f',
  surf:   '#0d0f1a',
  surf2:  '#121525',
  border: 'rgba(255,255,255,0.07)',
  muted:  'rgba(255,255,255,0.3)',
  text:   'rgba(255,255,255,0.88)',
};

// ── Donut SVG ────────────────────────────────────────────────────────────────
function Donut({ pct, color, size = 72 }) {
  const r   = 14;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 36 36"
      style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
      <circle cx="18" cy="18" r={r} fill="none"
        stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
      <circle cx="18" cy="18" r={r} fill="none"
        stroke={color} strokeWidth="4"
        strokeDasharray={`${dash.toFixed(2)} ${circ.toFixed(2)}`}
        strokeLinecap="round" />
      <text x="18" y="21" textAnchor="middle"
        fill={color} fontSize="7" fontWeight="900"
        transform="rotate(90,18,18)">
        {pct}%
      </text>
    </svg>
  );
}

// ── Big summary card ─────────────────────────────────────────────────────────
function SummaryCard({ icon, label, data }) {
  const col = STATUS_COLOR[data.color] || STATUS_COLOR.green;
  return (
    <div style={{
      background: col.bg, border: `1px solid ${col.border}`,
      borderRadius: '18px', padding: '18px 20px',
      display: 'flex', alignItems: 'center', gap: '16px',
      position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px',
        background: `linear-gradient(90deg,${col.text}cc,${col.text}11)` }} />
      <Donut pct={data.pct} color={col.text} size={80} />
      <div style={{ flex: 1 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
          <span style={{ fontSize:'16px' }}>{icon}</span>
          <span style={{ fontSize:'10px', color: C.muted, textTransform:'uppercase',
            letterSpacing:'0.12em', fontWeight: 900 }}>{label}</span>
          <span style={{ fontSize:'7px', padding:'2px 8px', borderRadius:'99px',
            background: col.text + '22', color: col.text, fontWeight:900,
            textTransform:'uppercase', letterSpacing:'0.08em' }}>{col.label}</span>
        </div>
        <div style={{ display:'flex', gap:'16px', flexWrap:'wrap' }}>
          {[
            { l: 'Present', v: data.present, c: '#34d399' },
            { l: 'Absent',  v: data.absent,  c: data.absent > 0 ? col.text : C.muted },
            { l: 'Total',   v: data.total,   c: C.text },
          ].map((x,i) => (
            <div key={i}>
              <div style={{ fontSize:'22px', fontWeight:900, color:x.c, lineHeight:1 }}>{x.v}</div>
              <div style={{ fontSize:'8px', color:C.muted, textTransform:'uppercase',
                letterSpacing:'0.08em', marginTop:'2px' }}>{x.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Class card ───────────────────────────────────────────────────────────────
function ClassCard({ cls }) {
  const [open, setOpen] = useState(false);
  const col = STATUS_COLOR[cls.color] || STATUS_COLOR.green;
  return (
    <div style={{
      background: col.bg, border: `1px solid ${col.border}`,
      borderRadius: '14px', overflow: 'hidden',
      transition: 'border-color 0.2s'
    }}>
      {/* Header row */}
      <div
        onClick={() => cls.absentList.length > 0 && setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '14px 16px',
          cursor: cls.absentList.length > 0 ? 'pointer' : 'default'
        }}
      >
        {/* Donut */}
        <Donut pct={cls.pct} color={col.text} size={56} />

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'3px', flexWrap:'wrap' }}>
            <span style={{ fontWeight:900, fontSize:'14px', color:C.text }}>
              Grade {cls.grade}
            </span>
            {cls.section && (
              <span style={{ fontSize:'9px', background:'rgba(255,255,255,0.07)',
                color:C.muted, padding:'2px 8px', borderRadius:'6px', fontWeight:900 }}>
                {cls.section}
              </span>
            )}
            <span style={{ fontSize:'7px', padding:'2px 8px', borderRadius:'99px',
              background: col.text + '22', color: col.text, fontWeight:900,
              textTransform:'uppercase', marginLeft:'auto' }}>{col.label}</span>
          </div>
          <div style={{ display:'flex', gap:'10px', fontSize:'9px' }}>
            <span style={{ color:'#34d399' }}>✓ {cls.present} present</span>
            {cls.absent > 0 && (
              <span style={{ color: col.text }}>✗ {cls.absent} absent</span>
            )}
            <span style={{ color:C.muted }}>/ {cls.total} total</span>
          </div>
        </div>

        {/* Chevron */}
        {cls.absentList.length > 0 && (
          <span style={{ color:C.muted, fontSize:'12px',
            transform: open ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }}>▼</span>
        )}
      </div>

      {/* Absent list */}
      {open && cls.absentList.length > 0 && (
        <div style={{ borderTop:`1px solid ${C.border}`, padding:'0 16px 14px' }}>
          {cls.absentList.map((a, i) => (
            <div key={i} style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'8px 0',
              borderBottom: i < cls.absentList.length-1 ? `1px solid ${C.border}` : 'none'
            }}>
              <div>
                <div style={{ fontSize:'12px', color:C.text, fontWeight:700 }}>{a.name}</div>
                <div style={{ fontSize:'8px', color:C.muted, marginTop:'1px' }}>
                  {a.leaveType} · {a.days}d
                </div>
              </div>
              <span style={{
                fontSize:'8px', fontWeight:900, padding:'3px 10px', borderRadius:'99px',
                background: (LEAVE_STATUS_COLOR[a.status]||'#aaa') + '22',
                color: LEAVE_STATUS_COLOR[a.status] || '#aaa',
                textTransform:'uppercase', letterSpacing:'0.06em'
              }}>{a.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Staff absent list ────────────────────────────────────────────────────────
function StaffAbsentCard({ absentList }) {
  if (!absentList || absentList.length === 0) return null;
  return (
    <div style={{ background:C.surf, border:`1px solid ${C.border}`,
      borderRadius:'14px', padding:'16px', marginTop:'0' }}>
      <p style={{ fontSize:'8px', color:C.muted, textTransform:'uppercase',
        letterSpacing:'0.14em', fontWeight:900, margin:'0 0 12px' }}>Absent Staff List</p>
      {absentList.map((a, i) => (
        <div key={i} style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'8px 0',
          borderBottom: i < absentList.length-1 ? `1px solid ${C.border}` : 'none'
        }}>
          <div>
            <div style={{ fontSize:'12px', color:C.text, fontWeight:700 }}>{a.name}</div>
            <div style={{ fontSize:'8px', color:C.muted, marginTop:'1px' }}>{a.leaveType}</div>
          </div>
          <span style={{
            fontSize:'8px', fontWeight:900, padding:'3px 10px', borderRadius:'99px',
            background: (LEAVE_STATUS_COLOR[a.status]||'#aaa') + '22',
            color: LEAVE_STATUS_COLOR[a.status] || '#aaa',
            textTransform:'uppercase'
          }}>{a.status}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function AttendancePage() {
  const router  = useRouter();
  const [date,    setDate]    = useState(toMyanmarDate());
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchData = useCallback(async (targetDate) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'getAttendance', date: targetDate })
      });
      const r = await res.json();
      if (r.success) setData(r);
      else setError(r.message || 'Error fetching data');
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    if (u.userRole !== 'management') { router.push('/login'); return; }
    fetchData(date);
  }, []);

  const handleDateChange = (e) => {
    const d = e.target.value;
    setDate(d);
    fetchData(d);
  };

  const today = toMyanmarDate();

  // Legend items
  const LEGEND = [
    { color:'#34d399', label:'All Approved / No Absent' },
    { color:'#fbbf24', label:'Has Pending Leave' },
    { color:'#f87171', label:'Has Rejected Leave' },
  ];

  return (
    <div style={{
      display:'flex', flexDirection:'column', height:'100%',
      overflow:'hidden', background:C.bg, color:C.text,
      fontFamily:'system-ui,sans-serif'
    }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box}
        input[type=date]{color-scheme:dark}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:99px}
      `}</style>

      {/* ── Header ── */}
      <div style={{
        flexShrink:0, zIndex:40,
        background:'rgba(7,8,15,0.97)', backdropFilter:'blur(16px)',
        borderBottom:`1px solid ${C.border}`, padding:'11px 16px',
        display:'flex', alignItems:'center', justifyContent:'space-between'
      }}>
        <button onClick={() => router.back()} style={{
          background:'none', border:'none', color:C.muted,
          cursor:'pointer', fontSize:'13px', padding:'4px 8px'
        }}>← Back</button>
        <div style={{ textAlign:'center' }}>
          <p style={{ fontWeight:900, fontSize:'12px', textTransform:'uppercase',
            letterSpacing:'0.12em', margin:0, color:C.text }}>Attendance</p>
          <p style={{ fontSize:'8px', color:'rgba(255,255,255,0.2)', margin:0 }}>
            Leave-based · {isToday(date) ? 'Today' : displayDate(date)}
          </p>
        </div>
        <button onClick={() => fetchData(date)} style={{
          background:'none', border:'none', color:C.muted,
          cursor:'pointer', fontSize:'16px', padding:'4px 8px'
        }}>↻</button>
      </div>

      {/* ── Body ── */}
      <div style={{ flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch', paddingBottom:'80px' }}>
        <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:'12px' }}>

          {/* Date picker */}
          <div style={{
            background:C.surf, border:`1px solid ${C.border}`,
            borderRadius:'14px', padding:'14px 16px',
            display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap'
          }}>
            <span style={{ fontSize:'9px', color:C.muted, textTransform:'uppercase',
              letterSpacing:'0.12em', fontWeight:900, whiteSpace:'nowrap' }}>📅 View Date</span>
            <input
              type="date"
              value={date}
              max={today}
              onChange={handleDateChange}
              style={{
                flex:1, minWidth:'140px',
                background:'rgba(255,255,255,0.06)',
                border:`1px solid ${C.border}`, borderRadius:'10px',
                padding:'8px 12px', color:C.text, fontSize:'13px',
                fontWeight:700, outline:'none'
              }}
            />
            {!isToday(date) && (
              <button onClick={() => { setDate(today); fetchData(today); }} style={{
                background:'rgba(255,255,255,0.06)', border:`1px solid ${C.border}`,
                borderRadius:'8px', padding:'7px 14px', color:C.muted,
                fontSize:'9px', textTransform:'uppercase', letterSpacing:'0.1em',
                fontWeight:900, cursor:'pointer', whiteSpace:'nowrap'
              }}>Today</button>
            )}
          </div>

          {/* Legend */}
          <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
            {LEGEND.map((l,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:l.color, flexShrink:0 }}/>
                <span style={{ fontSize:'8px', color:C.muted, textTransform:'uppercase',
                  letterSpacing:'0.08em' }}>{l.label}</span>
              </div>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
              justifyContent:'center', padding:'60px 0', gap:'12px' }}>
              <div style={{ width:'28px', height:'28px', border:`2px solid ${C.border}`,
                borderTop:'2px solid #fbbf24', borderRadius:'50%',
                animation:'spin 0.8s linear infinite' }}/>
              <span style={{ fontSize:'9px', color:C.muted, textTransform:'uppercase',
                letterSpacing:'0.15em' }}>Loading attendance…</span>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div style={{ background:'rgba(248,113,113,0.1)',
              border:'1px solid rgba(248,113,113,0.3)', borderRadius:'14px',
              padding:'20px', textAlign:'center' }}>
              <p style={{ color:'#f87171', fontWeight:900, margin:0 }}>⚠️ {error}</p>
            </div>
          )}

          {/* Data */}
          {!loading && !error && data && (
            <div style={{ display:'flex', flexDirection:'column', gap:'12px',
              animation:'fadeUp 0.25s ease' }}>

              {/* School-wide summary */}
              <SummaryCard icon="🏫" label="School-wide Students" data={data.school} />

              {/* Staff summary */}
              <SummaryCard icon="👔" label="Staff"               data={data.staff} />
              {data.staff.absentList?.length > 0 && (
                <StaffAbsentCard absentList={data.staff.absentList} />
              )}

              {/* Divider */}
              <div style={{ display:'flex', alignItems:'center', gap:'10px', margin:'4px 0' }}>
                <div style={{ flex:1, height:'1px', background:C.border }}/>
                <span style={{ fontSize:'8px', color:C.muted, textTransform:'uppercase',
                  letterSpacing:'0.18em', whiteSpace:'nowrap' }}>
                  Per Class · {data.classes.length} classes
                </span>
                <div style={{ flex:1, height:'1px', background:C.border }}/>
              </div>

              {/* Class cards */}
              {data.classes.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px 0', color:C.muted }}>
                  Class data မရှိပါ — Student_Directory ထဲမှာ Grade/Section စစ်ဆေးပါ
                </div>
              ) : (
                data.classes.map((cls, i) => (
                  <ClassCard key={`${cls.grade}-${cls.section}-${i}`} cls={cls} />
                ))
              )}

              {/* All-clear message */}
              {data.classes.length > 0 &&
               data.classes.every(c => c.color === 'green') &&
               data.school.absent === 0 && (
                <div style={{ background:'rgba(52,211,153,0.08)',
                  border:'1px solid rgba(52,211,153,0.25)', borderRadius:'14px',
                  padding:'18px', textAlign:'center' }}>
                  <div style={{ fontSize:'28px', marginBottom:'6px' }}>✅</div>
                  <p style={{ color:'#34d399', fontWeight:900, fontSize:'12px',
                    textTransform:'uppercase', letterSpacing:'0.1em', margin:0 }}>
                    Full Attendance — No Absences
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}