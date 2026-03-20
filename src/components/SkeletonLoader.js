"use client";
import { useState, useEffect } from 'react';

// ══════════════════════════════════════════════════════════════
//  Shining Stars — Loading Animations
//  FIX: No SSR/hydration mismatch — all animations client-only
// ══════════════════════════════════════════════════════════════

const CSS = `
@keyframes shimmer {
  0%   { background-position: -600px 0 }
  100% { background-position:  600px 0 }
}
@keyframes fadeInUp {
  from { opacity:0; transform:translateY(8px) }
  to   { opacity:1; transform:translateY(0) }
}
@keyframes sk-spin {
  to { transform: rotate(360deg) }
}
@keyframes sk-pulse {
  0%,100% { opacity:1; transform:scale(1) }
  50%     { opacity:.5; transform:scale(.93) }
}
@keyframes sk-float {
  0%,100% { transform:translateY(0px) }
  50%     { transform:translateY(-8px) }
}
@keyframes sk-star {
  0%,100% { opacity:.12 }
  50%     { opacity:.65 }
}
@keyframes sk-ring {
  0%   { transform:scale(.5); opacity:.7 }
  100% { transform:scale(1.9); opacity:0 }
}
@keyframes sk-wave {
  0%,100% { transform:scaleY(.35) }
  50%     { transform:scaleY(1) }
}
@keyframes sk-orbit {
  from { transform:rotate(0deg) translateX(var(--sk-r,60px)) rotate(0deg) }
  to   { transform:rotate(360deg) translateX(var(--sk-r,60px)) rotate(-360deg) }
}
@keyframes sk-orbit-rev {
  from { transform:rotate(360deg) translateX(var(--sk-r,60px)) rotate(-360deg) }
  to   { transform:rotate(0deg) translateX(var(--sk-r,60px)) rotate(0deg) }
}
.sk-shimmer {
  background:linear-gradient(90deg,
    rgba(255,255,255,0.04) 25%,
    rgba(255,255,255,0.10) 50%,
    rgba(255,255,255,0.04) 75%
  );
  background-size:600px 100%;
  animation:shimmer 1.6s ease-in-out infinite;
  border-radius:8px;
}
`;

function useStyle() {
  useEffect(() => {
    if (document.getElementById('sk-anim-style')) return;
    const el = document.createElement('style');
    el.id = 'sk-anim-style';
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
}

// ── Hook: prevent SSR render entirely ────────────────────────
function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

// ── Shimmer blocks (skeleton layout) ─────────────────────────
export function SkBlock({ w='100%', h=16, mb=0, br=8, style={} }) {
  useStyle();
  return <div className="sk-shimmer" style={{ width:w, height:h, marginBottom:mb, borderRadius:br, flexShrink:0, ...style }} />;
}
export function SkStatCard() {
  return (
    <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
        <SkBlock w={32} h={32} br={10} /><SkBlock w="60%" h={11} />
      </div>
      <SkBlock w="50%" h={26} mb={6} br={6} /><SkBlock w="80%" h={10} />
    </div>
  );
}
export function SkRow() {
  return (
    <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
      <SkBlock w={40} h={40} br={12} style={{ flexShrink:0 }} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
        <SkBlock w="55%" h={13} /><SkBlock w="35%" h={10} />
      </div>
      <SkBlock w={60} h={22} br={20} style={{ flexShrink:0 }} />
    </div>
  );
}
export function MiniSpinner({ color='#9E9ECA', size=20 }) {
  useStyle();
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', border:`2px solid ${color}22`, borderTop:`2px solid ${color}`, animation:'sk-spin 0.8s linear infinite', flexShrink:0 }}/>
  );
}

// ══════════════════════════════════════════════════════════════
//  FULL-PAGE LOADING SCREENS
//  All use useMounted() so they only render on client
//  → zero SSR/hydration mismatch
// ══════════════════════════════════════════════════════════════

// ── Inventory (Amber or Violet) ───────────────────────────────
export function InventorySkeleton({ title='Loading', accent='#fbbf24' }) {
  useStyle();
  const mounted = useMounted();

  const bg = accent === '#fbbf24'
    ? 'linear-gradient(145deg,#0f0a1e,#1a1200)'
    : 'linear-gradient(145deg,#0f0a1e,#12092a)';

  // Server + initial client render: simple dark screen
  if (!mounted) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100dvh', background: bg }} />
  );

  return (
    <FullAnim bg={bg} accent={accent} icon={accent==='#fbbf24'?'📦':'🏠'} title={title} hint="Data fetching..." />
  );
}

// ── Hostel Hub (Purple) ───────────────────────────────────────
export function HostelSkeleton() {
  useStyle();
  const mounted = useMounted();
  if (!mounted) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100dvh', background:'linear-gradient(145deg,#0a0516,#12092a)' }} />
  );
  return (
    <HostelAnim />
  );
}

// ── Management Dashboard (Gold) ───────────────────────────────
export function DashboardSkeleton() {
  useStyle();
  const mounted = useMounted();
  if (!mounted) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100dvh', background:'linear-gradient(150deg,#0D0C22,#1A1845,#0E1F3D)' }} />
  );
  return (
    <GoldAnim />
  );
}

// ══════════════════════════════════════════════════════════════
//  Animation Implementations (client-only — never SSR'd)
// ══════════════════════════════════════════════════════════════

// Star data: fully deterministic, same array every render
const makeStars = (count) => Array.from({length:count},(_,i)=>({
  top:  `${5  + (i*37+11) % 88}%`,
  left: `${3  + (i*53+7)  % 94}%`,
  size: 1.5 + (i%3)*0.8,
  dur:  `${1.8 + (i%5)*0.6}s`,
  delay:`${-(i*0.31).toFixed(2)}s`,
}));

// Orbit dot data: deterministic
const makeOrbits = (r, count, offset=0) => Array.from({length:count},(_,i)=>({
  deg:   (i*(360/count))+offset,
  r,
}));

function FullAnim({ bg, accent, icon, title, hint }) {
  const c1 = accent, c2 = accent+'88', c3 = accent+'33';
  const stars = makeStars(26);
  const orbit1 = makeOrbits(80, 3, 0);
  const orbit2 = makeOrbits(110, 3, 60);

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100dvh', background:bg, color:'#fff', fontFamily:'system-ui,sans-serif', overflow:'hidden', position:'relative' }}>

      {/* Starfield */}
      {stars.map((s,i)=>(
        <div key={i} style={{ position:'absolute', top:s.top, left:s.left, width:s.size, height:s.size, borderRadius:'50%', background:'#fff', opacity:0.25, animation:`sk-star ${s.dur} ease-in-out ${s.delay} infinite` }}/>
      ))}

      {/* Orbit container */}
      <div style={{ position:'relative', width:180, height:180, marginBottom:28 }}>

        {/* Static rings */}
        {[80,110,140].map((r,i)=>(
          <div key={i} style={{ position:'absolute', top:'50%', left:'50%', width:r*2, height:r*2, marginTop:-r, marginLeft:-r, border:`1px solid ${c1}${['18','10','08'][i]}`, borderRadius:'50%' }}/>
        ))}

        {/* Expanding pulse rings */}
        {[0,700,1400].map((d,i)=>(
          <div key={i} style={{ position:'absolute', top:'50%', left:'50%', width:90, height:90, marginTop:-45, marginLeft:-45, border:`2px solid ${c1}44`, borderRadius:'50%', animation:`sk-ring 2.4s ease-out ${d}ms infinite` }}/>
        ))}

        {/* Orbit dots ring 1 */}
        {orbit1.map((o,i)=>{
          const rad = o.deg*Math.PI/180;
          const x = Math.cos(rad)*o.r, y = Math.sin(rad)*o.r;
          return (
            <div key={i} style={{ position:'absolute', top:'50%', left:'50%', width:8, height:8, borderRadius:'50%', background:c1, boxShadow:`0 0 10px ${c1}`, '--sk-r':`${o.r}px`, transformOrigin:'0 0', animation:`sk-orbit 3.2s linear ${(-i*1.07).toFixed(2)}s infinite`, marginTop:y-4, marginLeft:x-4 }}/>
          );
        })}

        {/* Orbit dots ring 2 (reverse) */}
        {orbit2.map((o,i)=>{
          const rad = o.deg*Math.PI/180;
          const x = Math.cos(rad)*o.r, y = Math.sin(rad)*o.r;
          return (
            <div key={i} style={{ position:'absolute', top:'50%', left:'50%', width:6, height:6, borderRadius:'50%', background:c2, boxShadow:`0 0 8px ${c2}`, '--sk-r':`${o.r}px`, transformOrigin:'0 0', animation:`sk-orbit-rev 5s linear ${(-i*1.67).toFixed(2)}s infinite`, marginTop:y-3, marginLeft:x-3 }}/>
          );
        })}

        {/* Outer slow dot */}
        <div style={{ position:'absolute', top:'50%', left:`calc(50% + 140px)`, width:5, height:5, marginTop:-2.5, marginLeft:-2.5, borderRadius:'50%', background:c3, '--sk-r':'140px', transformOrigin:`-140px 0`, animation:`sk-orbit 7.5s linear 0s infinite` }}/>

        {/* Center icon */}
        <div style={{ position:'absolute', top:'50%', left:'50%', width:54, height:54, marginTop:-27, marginLeft:-27, background:`radial-gradient(circle, ${c1}22, transparent 70%)`, border:`1.5px solid ${c1}55`, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, animation:'sk-float 3s ease-in-out infinite' }}>
          {icon}
        </div>
      </div>

      <p style={{ fontSize:14, fontWeight:900, letterSpacing:'0.18em', textTransform:'uppercase', color:c1, animation:'sk-pulse 2.4s ease-in-out infinite', marginBottom:8 }}>
        {title}
      </p>

      <WaveBars color={c1} />

      <p style={{ marginTop:14, fontSize:10, color:'rgba(255,255,255,0.2)', letterSpacing:'0.1em' }}>{hint}</p>
    </div>
  );
}

function HostelAnim() {
  const stars = makeStars(32);
  const emojis = ['⭐','✨','💫','🌟'];

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100dvh', background:'linear-gradient(145deg,#0a0516,#12092a,#0a0d1f)', color:'#fff', fontFamily:'system-ui,sans-serif', overflow:'hidden', position:'relative' }}>

      {stars.map((s,i)=>(
        <div key={i} style={{ position:'absolute', top:s.top, left:s.left, width:s.size, height:s.size, borderRadius:'50%', background:'#fff', opacity:0.22, animation:`sk-star ${s.dur} ease-in-out ${s.delay} infinite` }}/>
      ))}

      <div style={{ position:'relative', width:200, height:200, marginBottom:26 }}>
        {/* Rotating dashed ring */}
        <div style={{ position:'absolute', inset:0, border:'1.5px dashed rgba(167,139,250,0.2)', borderRadius:'50%', animation:'sk-spin 14s linear infinite' }}/>
        <div style={{ position:'absolute', inset:28, border:'1px solid rgba(167,139,250,0.12)', borderRadius:'50%', animation:'sk-spin 9s linear infinite reverse' }}/>

        {/* Pulse rings */}
        {[0,900,1800].map((d,i)=>(
          <div key={i} style={{ position:'absolute', top:'50%', left:'50%', width:88, height:88, marginTop:-44, marginLeft:-44, border:'2px solid rgba(167,139,250,0.35)', borderRadius:'50%', animation:`sk-ring 2.8s ease-out ${d}ms infinite` }}/>
        ))}

        {/* Emoji orbit */}
        {emojis.map((em,i)=>{
          const deg = i*90;
          const rad = deg*Math.PI/180;
          const r = 78;
          const x = Math.cos(rad)*r, y = Math.sin(rad)*r;
          return (
            <div key={i} style={{ position:'absolute', top:'50%', left:'50%', fontSize:13, lineHeight:1, '--sk-r':`${r}px`, transformOrigin:'0 0', animation:`sk-orbit ${6+i*0.5}s linear ${(-i*1.5).toFixed(1)}s infinite`, marginTop:y-6, marginLeft:x-6 }}>
              {em}
            </div>
          );
        })}

        {/* Center */}
        <div style={{ position:'absolute', top:'50%', left:'50%', width:60, height:60, marginTop:-30, marginLeft:-30, background:'radial-gradient(circle, rgba(167,139,250,0.22), transparent 70%)', border:'1.5px solid rgba(167,139,250,0.4)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, animation:'sk-float 3.5s ease-in-out infinite' }}>
          🏫
        </div>
      </div>

      <p style={{ fontSize:14, fontWeight:900, letterSpacing:'0.2em', textTransform:'uppercase', color:'#a78bfa', animation:'sk-pulse 2s ease-in-out infinite', marginBottom:8 }}>
        HOSTEL HUB
      </p>

      <WaveBars color="#a78bfa" />
      <p style={{ marginTop:14, fontSize:10, color:'rgba(255,255,255,0.2)', letterSpacing:'0.1em' }}>Initializing dashboard...</p>
    </div>
  );
}

function GoldAnim() {
  const stars = makeStars(22);
  const ring1 = makeOrbits(82, 4, 0);
  const ring2 = makeOrbits(60, 4, 45);

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100dvh', background:'linear-gradient(150deg,#0D0C22,#1A1845,#0E1F3D)', color:'#fff', fontFamily:'system-ui,sans-serif', overflow:'hidden', position:'relative' }}>

      {stars.map((s,i)=>(
        <div key={i} style={{ position:'absolute', top:s.top, left:s.left, width:s.size, height:s.size, borderRadius:'50%', background:'#D4AF37', opacity:0.2, animation:`sk-star ${s.dur} ease-in-out ${s.delay} infinite` }}/>
      ))}

      <div style={{ position:'relative', width:190, height:190, marginBottom:26 }}>

        {/* Pulse rings */}
        {[0,600,1200].map((d,i)=>(
          <div key={i} style={{ position:'absolute', top:'50%', left:'50%', width:96, height:96, marginTop:-48, marginLeft:-48, border:'2px solid rgba(212,175,55,0.4)', borderRadius:'50%', animation:`sk-ring 2.5s ease-out ${d}ms infinite` }}/>
        ))}

        <div style={{ position:'absolute', inset:0, border:'1px solid rgba(212,175,55,0.14)', borderRadius:'50%', animation:'sk-spin 16s linear infinite' }}/>
        <div style={{ position:'absolute', inset:22, border:'1px dashed rgba(212,175,55,0.09)', borderRadius:'50%', animation:'sk-spin 10s linear infinite reverse' }}/>

        {ring1.map((o,i)=>{
          const rad=o.deg*Math.PI/180, x=Math.cos(rad)*o.r, y=Math.sin(rad)*o.r;
          return <div key={i} style={{ position:'absolute', top:'50%', left:'50%', width:7, height:7, borderRadius:'50%', background:'#D4AF37', boxShadow:'0 0 8px #D4AF37', '--sk-r':`${o.r}px`, transformOrigin:'0 0', animation:`sk-orbit 4s linear ${-i}s infinite`, marginTop:y-3.5, marginLeft:x-3.5 }}/>;
        })}
        {ring2.map((o,i)=>{
          const rad=o.deg*Math.PI/180, x=Math.cos(rad)*o.r, y=Math.sin(rad)*o.r;
          return <div key={i} style={{ position:'absolute', top:'50%', left:'50%', width:4, height:4, borderRadius:'50%', background:'#D4AF3788', '--sk-r':`${o.r}px`, transformOrigin:'0 0', animation:`sk-orbit-rev 5.5s linear ${(-i*1.4).toFixed(1)}s infinite`, marginTop:y-2, marginLeft:x-2 }}/>;
        })}

        <div style={{ position:'absolute', top:'50%', left:'50%', width:58, height:58, marginTop:-29, marginLeft:-29, background:'linear-gradient(135deg,rgba(212,175,55,0.22),rgba(212,175,55,0.04))', border:'1.5px solid rgba(212,175,55,0.5)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, animation:'sk-float 3s ease-in-out infinite' }}>
          🏫
        </div>
      </div>

      <p style={{ fontFamily:"Georgia,serif", fontSize:17, fontWeight:700, fontStyle:'italic', color:'#D4AF37', animation:'sk-pulse 2.5s ease-in-out infinite', marginBottom:6, letterSpacing:'0.06em' }}>
        Shining Stars
      </p>

      <WaveBars color="#D4AF37" />
      <p style={{ marginTop:14, fontSize:10, color:'rgba(255,255,255,0.2)', letterSpacing:'0.1em' }}>Loading dashboard...</p>
    </div>
  );
}

function WaveBars({ color }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:3, height:20 }}>
      {[0,1,2,3,4].map(i=>(
        <div key={i} style={{ width:3, height:18, borderRadius:99, background:color, opacity:0.7, animation:`sk-wave 1s ease-in-out ${(i*0.12).toFixed(2)}s infinite`, transformOrigin:'center bottom' }}/>
      ))}
    </div>
  );
}
