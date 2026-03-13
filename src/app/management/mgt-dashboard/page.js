"use client";
import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';

// ── helpers ─────────────────────────────────────────────────────
const extractGrade = (l) => {
  const uid = String(l.User_ID || '');
  const m = uid.match(/G(\d+)/i);
  if (m) return `Grade ${m[1]}`;
  const g = String(l.Grade || l.grade || '');
  if (g) return g.startsWith('Grade') ? g : `Grade ${g}`;
  return '';
};
const fmtDate = (d) => {
  if (!d) return '-';
  try { return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}); }
  catch { return d; }
};

export default function LeaveHub() {
  const router = useRouter();
  const [allLeaves, setAllLeaves] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [proc,      setProc]      = useState(false);
  const [tab,       setTab]       = useState("QUEUE");
  const [aTab,      setATab]      = useState("OVERVIEW");
  const [uFilter,   setUFilter]   = useState("ALL");
  const [gradeFilter,setGradeFilter]=useState("ALL");
  const [abView,    setAbView]    = useState("CONSEC");
  const [expanded,  setExpanded]  = useState({});
  const [selected,  setSelected]  = useState(new Set()); // selected person names for print/view
  const [viewMode,  setViewMode]  = useState(false);     // show only selected
  const [rangeFilter,setRangeFilter]=useState("ALL");
  const [typeFilter, setTypeFilter] =useState("ALL");
  const printRef = useRef(null);

  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || "null");
    if (!auth || auth.userRole !== 'management') { router.push('/login'); return; }
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    setLoading(true);
    try {
      const res = await fetch(WEB_APP_URL, { method:'POST', body:JSON.stringify({action:'getInitialData'}) });
      const r = await res.json();
      if (r.success) setAllLeaves((r.leaves||[]).map((l,i)=>({...l,_rowIndex:i+2})));
    } catch(e){console.error(e);}
    finally{setLoading(false);}
  };

  const handleAction = async (leave, status) => {
    const gm = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || "{}");
    if (!gm.Name) return alert("Session Expired.");
    setProc(true);
    try {
      const d = new Date(leave.Start_Date);
      const cleanDate = isNaN(d) ? (leave.Start_Date||'') : d.toLocaleDateString('en-CA');
      const res = await fetch(WEB_APP_URL,{method:'POST',body:JSON.stringify({
        action:'updateLeave', rowIndex:leave._rowIndex,
        userId:leave.User_ID, name:leave.Name,
        startDate:cleanDate, status, approvedBy:gm.Name
      })});
      const r = await res.json();
      if (r.success) {
        setAllLeaves(prev=>prev.map(l=>l._rowIndex===leave._rowIndex?{...l,Status:status,Approved_By:gm.Name}:l));
      } else { alert("FAIL: "+r.message); }
    } catch { alert("Network Error"); }
    finally { setProc(false); }
  };

  const pending = allLeaves.filter(x=>x.Status==="Pending");
  const history = allLeaves.filter(x=>x.Status!=="Pending");
  const approved = useMemo(()=>allLeaves.filter(l=>l.Status==="Approved"),[allLeaves]);

  const allGrades = useMemo(()=>{
    const gs = new Set();
    approved.filter(l=>l.User_Type==='STUDENT').forEach(l=>{const g=extractGrade(l);if(g)gs.add(g);});
    return ['ALL',...Array.from(gs).sort()];
  },[approved]);

  // ── Absence analysis data ────────────────────────────────────
  const absenceData = useMemo(()=>{
    const filtered = approved.filter(l=>{
      if (uFilter!=='ALL' && l.User_Type!==uFilter) return false;
      if (gradeFilter!=='ALL'){
        if (l.User_Type!=='STUDENT') return false;
        if (extractGrade(l)!==gradeFilter) return false;
      }
      return true;
    });

    // Per-person aggregate
    const pm = {};
    filtered.forEach(l=>{
      const k = l.Name||'Unknown';
      if (!pm[k]) pm[k]={name:k,type:l.User_Type,id:l.User_ID,grade:extractGrade(l),records:[],totalDays:0};
      pm[k].records.push(l);
      pm[k].totalDays += Number(l.Total_Days||1);
    });
    const persons = Object.values(pm).sort((a,b)=>b.totalDays-a.totalDays);

    const total2plus  = persons.filter(p=>p.totalDays>=2);
    const total5plus  = persons.filter(p=>p.totalDays>=5);
    const total10plus = persons.filter(p=>p.totalDays>=10);

    // Grade summary
    const gm2 = {};
    persons.forEach(p=>{
      const g = p.grade||'Unknown';
      if(!gm2[g]) gm2[g]={grade:g,people:0,totalDays:0,records:0};
      gm2[g].people++;
      gm2[g].totalDays+=p.totalDays;
      gm2[g].records+=p.records.length;
    });
    const byGrade = Object.values(gm2).sort((a,b)=>b.totalDays-a.totalDays);

    // Consecutive groups: exactly N days (2,3,4,5,6) + 7+
    const consecGroups = [2,3,4,5,6].map(n=>({
      label:`${n} ရက် ဆက်တိုက်`,
      records: filtered.filter(l=>Number(l.Total_Days||1)===n)
        .sort((a,b)=>new Date(b.Start_Date)-new Date(a.Start_Date))
    }));
    consecGroups.push({
      label:'7 ရက်နဲ့ အထက် ဆက်တိုက်',
      records: filtered.filter(l=>Number(l.Total_Days||1)>=7)
        .sort((a,b)=>Number(b.Total_Days||1)-Number(a.Total_Days||1))
    });

    return {persons,total2plus,total5plus,total10plus,byGrade,consecGroups,filtered};
  },[approved,uFilter,gradeFilter]);

  // ── Overview data ────────────────────────────────────────────
  const now = new Date();
  const analysisLeaves = useMemo(()=>allLeaves.filter(l=>{
    const days=(now-new Date(l.Start_Date))/86400000;
    if(rangeFilter==="7D")  return days<=7;
    if(rangeFilter==="30D") return days<=30;
    if(rangeFilter==="90D") return days<=90;
    return true;
  }).filter(l=>typeFilter==="ALL"||l.User_Type===typeFilter),[allLeaves,rangeFilter,typeFilter]);

  const leaveCounts = analysisLeaves.reduce((acc,l)=>{
    const k=l.Name||"Unknown";
    if(!acc[k]) acc[k]={name:k,type:l.User_Type,count:0,days:0};
    acc[k].count++; acc[k].days+=Number(l.Total_Days||1); return acc;
  },{});
  const topLeaves = Object.values(leaveCounts).sort((a,b)=>b.days-a.days).slice(0,10);
  const leaveTypeCount = analysisLeaves.reduce((acc,l)=>{
    const t=l.Leave_Type||"Other"; acc[t]=(acc[t]||0)+1; return acc;
  },{});
  const leaveTypes   = Object.entries(leaveTypeCount).sort((a,b)=>b[1]-a[1]);
  const maxTypeCount = leaveTypes[0]?.[1]||1;
  const monthlyData  = Array.from({length:6},(_,i)=>{
    const d=new Date(now.getFullYear(),now.getMonth()-(5-i),1);
    const label=d.toLocaleDateString('en-US',{month:'short'});
    const count=allLeaves.filter(l=>{
      const ld=new Date(l.Start_Date);
      return ld.getFullYear()===d.getFullYear()&&ld.getMonth()===d.getMonth();
    }).length;
    return {label,count};
  });
  const maxMonth = Math.max(...monthlyData.map(m=>m.count),1);

  // ── Selection helpers ────────────────────────────────────────
  const toggleSelect = (name) => setSelected(prev => {
    const next = new Set(prev);
    next.has(name) ? next.delete(name) : next.add(name);
    return next;
  });
  const selectAll = (names) => setSelected(new Set(names));
  const clearAll  = () => { setSelected(new Set()); setViewMode(false); };

  // Visible persons/records after selection-filter
  const visiblePersons = (list) =>
    viewMode && selected.size > 0 ? list.filter(p => selected.has(p.name)) : list;
  const visibleRecords = (list) =>
    viewMode && selected.size > 0 ? list.filter(r => selected.has(r.Name||'Unknown')) : list;

  // ── Print ────────────────────────────────────────────────────
  const handlePrint = () => {
    const printPersons = selected.size > 0
      ? absenceData.persons.filter(p => selected.has(p.name))
      : absenceData.total2plus;

    const printConsecGroups = absenceData.consecGroups.map(g => ({
      ...g,
      records: selected.size > 0 ? g.records.filter(r => selected.has(r.Name||'Unknown')) : g.records
    }));

    const personRows = (list) => list.map(p => `
      <h3>${p.name}
        <span class="badge ${p.type==='STAFF'?'badge-staff':'badge-student'}">${p.type}</span>
        ${p.grade?`<span class="badge" style="background:#f1f5f9;color:#475569">${p.grade}</span>`:''}
        <span style="color:#dc2626;font-weight:900;margin-left:8px">${p.totalDays} days total · ${p.records.length}x</span>
      </h3>
      <table><thead><tr><th>Leave Type</th><th>Start</th><th>End</th><th>Days</th><th>Reason</th><th>Status</th></tr></thead>
      <tbody>${p.records.sort((a,b)=>new Date(b.Start_Date)-new Date(a.Start_Date)).map(r=>`
        <tr><td>${r.Leave_Type||'-'}</td><td>${r.Start_Date||'-'}</td><td>${r.End_Date||'-'}</td>
        <td style="font-weight:900;color:#dc2626">${r.Total_Days||1}</td>
        <td>${r.Reason&&r.Reason!=='-'?r.Reason:'-'}</td>
        <td>${r.Status||'-'}</td></tr>
      `).join('')}</tbody></table>
    `).join('');

    const consecRows = printConsecGroups.map(g => g.records.length===0 ? '' : `
      <h2>${g.label} (${g.records.length} records)</h2>
      <table><thead><tr><th>Name</th><th>Type</th><th>Grade</th><th>Leave Type</th><th>Start</th><th>End</th><th>Days</th><th>Reason</th></tr></thead>
      <tbody>${g.records.map(r=>`
        <tr><td>${r.Name||'-'}</td><td>${r.User_Type||'-'}</td><td>${extractGrade(r)||'-'}</td>
        <td>${r.Leave_Type||'-'}</td><td>${r.Start_Date||'-'}</td><td>${r.End_Date||'-'}</td>
        <td style="font-weight:900;color:#dc2626">${r.Total_Days||1}</td>
        <td>${r.Reason&&r.Reason!=='-'?r.Reason:'-'}</td></tr>
      `).join('')}</tbody></table>
    `).join('');

    const w = window.open('','_blank');
    w.document.write(`<html><head><title>Leave Absence Report</title><style>
      body{font-family:Arial,sans-serif;font-size:11px;color:#111;padding:20px;}
      h1{font-size:18px;margin-bottom:4px;font-family:serif;}
      .subtitle{color:#666;font-size:10px;margin-bottom:20px;}
      table{width:100%;border-collapse:collapse;margin-bottom:20px;page-break-inside:avoid;}
      th{background:#1e293b;color:#fff;padding:6px 10px;text-align:left;font-size:10px;text-transform:uppercase;}
      td{padding:5px 10px;border-bottom:1px solid #eee;vertical-align:top;}
      tr:nth-child(even) td{background:#f8f8f8;}
      h2{font-size:13px;margin:20px 0 6px;border-bottom:2px solid #111;padding-bottom:4px;font-family:serif;}
      h3{font-size:12px;margin:14px 0 4px;border-left:3px solid #dc2626;padding-left:8px;}
      .badge{display:inline-block;padding:1px 6px;border-radius:4px;font-size:9px;font-weight:bold;margin:0 2px;}
      .badge-student{background:#dbeafe;color:#1d4ed8;}
      .badge-staff{background:#fef3c7;color:#92400e;}
    </style></head><body>
    <h1>Leave Absence Analysis Report</h1>
    <p class="subtitle">
      Filter: ${uFilter==='ALL'?'All Users':uFilter} · ${gradeFilter!=='ALL'?gradeFilter:'All Grades'} ·
      View: ${abView==='TOTAL'?'Total Absence':'Consecutive Absence'} ·
      ${selected.size>0?`Selected: ${selected.size} ယောက်`:'All records'} ·
      Generated: ${new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}
    </p>
    ${abView==='TOTAL' ? `<h2>Absence Records</h2>${personRows(printPersons)}` : consecRows}
    </body></html>`);
    w.document.close(); w.focus();
    setTimeout(()=>{w.print();w.close();},600);
  };

  const toggleExpand = (key) => setExpanded(prev=>({...prev,[key]:!prev[key]}));

  // ── Sub-components ───────────────────────────────────────────
  const PersonCard = ({person,rank}) => {
    const isOpen   = expanded['p_'+person.name];
    const isSel    = selected.has(person.name);
    return (
      <div style={{background: isSel?'#f0fdf4':'#fff',borderRadius:16,
        border: isSel?'1.5px solid #86efac':'1.5px solid #e2e8f0',
        marginBottom:8,overflow:'hidden',boxShadow:'0 1px 6px rgba(0,0,0,0.06)',
        transition:'background 0.15s, border-color 0.15s'}}>
        <div style={{padding:'12px 14px',display:'flex',alignItems:'center',gap:10}}>
          {/* Checkbox */}
          <div onClick={()=>toggleSelect(person.name)}
            style={{flexShrink:0,width:22,height:22,borderRadius:6,cursor:'pointer',
              border:isSel?'2px solid #16a34a':'2px solid #cbd5e1',
              background:isSel?'#16a34a':'#fff',
              display:'flex',alignItems:'center',justifyContent:'center',
              transition:'all 0.15s',userSelect:'none'}}>
            {isSel&&<span style={{color:'#fff',fontSize:13,fontWeight:900,lineHeight:1}}>✓</span>}
          </div>
          <div style={{flexShrink:0,width:36,height:36,borderRadius:10,
            background:person.type==='STAFF'?'#fef3c7':'#dbeafe',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>
            {person.type==='STAFF'?'👔':'🎓'}
          </div>
          <div style={{flex:1,minWidth:0}} onClick={()=>toggleExpand('p_'+person.name)} className="cursor-pointer">
            <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
              {rank<3&&<span>{rank===0?'🥇':rank===1?'🥈':'🥉'}</span>}
              <span style={{fontWeight:800,fontSize:13,color:'#0f172a',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{person.name}</span>
              <span style={{fontSize:8,fontWeight:700,padding:'1px 6px',borderRadius:99,
                background:person.type==='STAFF'?'#fef3c7':'#dbeafe',
                color:person.type==='STAFF'?'#92400e':'#1d4ed8',textTransform:'uppercase'}}>{person.type}</span>
              {person.grade&&<span style={{fontSize:8,fontWeight:600,color:'#64748b',padding:'1px 5px',background:'#f1f5f9',borderRadius:99}}>{person.grade}</span>}
            </div>
            <div style={{fontSize:9,color:'#94a3b8',marginTop:2}}>ID: {person.id} · {person.records.length} ကြိမ်</div>
          </div>
          <div style={{flexShrink:0,textAlign:'right'}} onClick={()=>toggleExpand('p_'+person.name)} className="cursor-pointer">
            <div style={{fontSize:22,fontWeight:900,color:'#dc2626',lineHeight:1}}>{person.totalDays}</div>
            <div style={{fontSize:8,fontWeight:700,color:'#94a3b8',textTransform:'uppercase'}}>days</div>
          </div>
          <span onClick={()=>toggleExpand('p_'+person.name)}
            style={{flexShrink:0,fontSize:11,color:'#94a3b8',transform:isOpen?'rotate(180deg)':'none',
              transition:'transform 0.2s',cursor:'pointer'}}>▼</span>
        </div>
        {isOpen&&(
          <div style={{borderTop:'1px solid #f1f5f9'}}>
            <div style={{padding:'5px 14px',background:'#f8fafc',fontSize:8,fontWeight:700,color:'#94a3b8',
              display:'grid',gridTemplateColumns:'1.2fr 0.9fr 0.9fr 56px 60px',
              textTransform:'uppercase',letterSpacing:'0.05em',gap:4}}>
              <span>Leave Type</span><span>Start</span><span>End</span><span>Days</span><span>Status</span>
            </div>
            {person.records.sort((a,b)=>new Date(b.Start_Date)-new Date(a.Start_Date)).map((r,ri)=>(
              <div key={ri} style={{padding:'8px 14px',borderBottom:'1px solid #f1f5f9',
                display:'grid',gridTemplateColumns:'1.2fr 0.9fr 0.9fr 56px 60px',
                alignItems:'start',background:ri%2===0?'#fff':'#fafafa',gap:4}}>
                <div>
                  <div style={{fontSize:11,fontWeight:600,color:'#1e293b'}}>{r.Leave_Type||'-'}</div>
                  {r.Reason&&r.Reason!=='-'&&(
                    <div style={{fontSize:9,color:'#64748b',marginTop:1,fontStyle:'italic'}}>
                      "{String(r.Reason).slice(0,55)}{r.Reason.length>55?'…':''}"
                    </div>
                  )}
                </div>
                <div style={{fontSize:10,color:'#475569'}}>{fmtDate(r.Start_Date)}</div>
                <div style={{fontSize:10,color:'#475569'}}>{fmtDate(r.End_Date)}</div>
                <div style={{fontSize:14,fontWeight:900,color:'#dc2626'}}>{r.Total_Days||1}d</div>
                <div><span style={{fontSize:8,fontWeight:700,padding:'2px 5px',borderRadius:5,textTransform:'uppercase',
                  background:r.Status==='Approved'?'#dcfce7':r.Status==='Pending'?'#fef3c7':'#fee2e2',
                  color:r.Status==='Approved'?'#15803d':r.Status==='Pending'?'#a16207':'#dc2626'}}>
                  {r.Status}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const ConsecCard = ({record,cardKey}) => {
    const isOpen    = expanded['c_'+cardKey];
    const personName= record.Name||'Unknown';
    const isSel     = selected.has(personName);
    const personObj = absenceData.persons.find(p=>p.name===personName);
    return (
      <div style={{background:isSel?'#f0fdf4':'#fff',borderRadius:16,
        border:isSel?'1.5px solid #86efac':'1.5px solid #e2e8f0',
        marginBottom:8,overflow:'hidden',boxShadow:'0 1px 6px rgba(0,0,0,0.06)',
        transition:'background 0.15s, border-color 0.15s'}}>
        <div style={{padding:'12px 14px',display:'flex',alignItems:'center',gap:10}}>
          {/* Checkbox */}
          <div onClick={()=>toggleSelect(personName)}
            style={{flexShrink:0,width:22,height:22,borderRadius:6,cursor:'pointer',
              border:isSel?'2px solid #16a34a':'2px solid #cbd5e1',
              background:isSel?'#16a34a':'#fff',
              display:'flex',alignItems:'center',justifyContent:'center',
              transition:'all 0.15s',userSelect:'none'}}>
            {isSel&&<span style={{color:'#fff',fontSize:13,fontWeight:900,lineHeight:1}}>✓</span>}
          </div>
          <div style={{flexShrink:0,width:38,height:38,borderRadius:10,background:'#fef2f2',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:13,fontWeight:900,color:'#dc2626'}}>
            {record.Total_Days||1}d
          </div>
          <div style={{flex:1,minWidth:0}} onClick={()=>toggleExpand('c_'+cardKey)} className="cursor-pointer">
            <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
              <span style={{fontWeight:800,fontSize:13,color:'#0f172a'}}>{personName}</span>
              <span style={{fontSize:8,fontWeight:700,padding:'1px 6px',borderRadius:99,
                background:record.User_Type==='STAFF'?'#fef3c7':'#dbeafe',
                color:record.User_Type==='STAFF'?'#92400e':'#1d4ed8',textTransform:'uppercase'}}>{record.User_Type}</span>
              {extractGrade(record)&&<span style={{fontSize:8,fontWeight:600,color:'#64748b',padding:'1px 5px',background:'#f1f5f9',borderRadius:99}}>{extractGrade(record)}</span>}
            </div>
            <div style={{fontSize:9,color:'#94a3b8',marginTop:2}}>
              {record.Leave_Type||'-'} · {fmtDate(record.Start_Date)} → {fmtDate(record.End_Date)}
            </div>
            {record.Reason&&record.Reason!=='-'&&(
              <div style={{fontSize:9,color:'#64748b',marginTop:1,fontStyle:'italic'}}>
                "{String(record.Reason).slice(0,65)}{record.Reason.length>65?'…':''}"
              </div>
            )}
          </div>
          {personObj&&(
            <div style={{flexShrink:0,textAlign:'right'}} onClick={()=>toggleExpand('c_'+cardKey)} className="cursor-pointer">
              <div style={{fontSize:9,color:'#64748b',fontWeight:600}}>စုစုပေါင်း</div>
              <div style={{fontSize:16,fontWeight:900,color:'#7c3aed',lineHeight:1}}>{personObj.totalDays}d</div>
              <div style={{fontSize:8,color:'#94a3b8'}}>{personObj.records.length}x</div>
            </div>
          )}
          <span onClick={()=>toggleExpand('c_'+cardKey)}
            style={{flexShrink:0,fontSize:11,color:'#94a3b8',transform:isOpen?'rotate(180deg)':'none',
              transition:'transform 0.2s',cursor:'pointer'}}>▼</span>
        </div>
        {isOpen&&personObj&&(
          <div style={{borderTop:'1px solid #f1f5f9'}}>
            <div style={{padding:'5px 14px',background:'#faf5ff',fontSize:8,fontWeight:700,
              color:'#7c3aed',textTransform:'uppercase',letterSpacing:'0.04em'}}>
              Leave History အားလုံး — {personObj.name}
            </div>
            {personObj.records.sort((a,b)=>new Date(b.Start_Date)-new Date(a.Start_Date)).map((r,ri)=>(
              <div key={ri} style={{padding:'8px 14px',borderBottom:'1px solid #f1f5f9',
                display:'flex',alignItems:'center',gap:10,background:ri%2===0?'#fff':'#fafafa'}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,fontWeight:600,color:'#1e293b'}}>{r.Leave_Type||'-'} · {fmtDate(r.Start_Date)} → {fmtDate(r.End_Date)}</div>
                  {r.Reason&&r.Reason!=='-'&&(
                    <div style={{fontSize:9,color:'#64748b',fontStyle:'italic'}}>"{r.Reason}"</div>
                  )}
                </div>
                <div style={{flexShrink:0,display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:15,fontWeight:900,color:'#dc2626'}}>{r.Total_Days||1}d</span>
                  <span style={{fontSize:8,fontWeight:700,padding:'2px 6px',borderRadius:5,textTransform:'uppercase',
                    background:r.Status==='Approved'?'#dcfce7':r.Status==='Pending'?'#fef3c7':'#fee2e2',
                    color:r.Status==='Approved'?'#15803d':r.Status==='Pending'?'#a16207':'#dc2626'}}>
                    {r.Status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const TABS = [
    {id:"QUEUE",    label:"Queue",    badge:pending.length},
    {id:"ANALYSIS", label:"Analysis", badge:null},
    {id:"HISTORY",  label:"History",  badge:history.length},
  ];

  if (loading||proc) return (
    <div className="min-h-[50vh] flex items-center justify-center font-black text-[#4c1d95] animate-pulse uppercase italic tracking-widest text-lg">
      {proc?"Processing...":"Loading Leave Hub..."}
    </div>
  );

  return (
    <div style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch'}}
      className="bg-[#F0F9FF] font-black text-slate-950 p-4 md:p-6 pb-36">
      <div className="max-w-[960px] mx-auto space-y-6">

        {/* HEADER */}
        <div className="bg-slate-950 rounded-[2.5rem] p-7 border-b-[10px] border-[#fbbf24] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-56 h-56 bg-[#fbbf24]/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"/>
          <div className="z-10">
            <p className="text-[#fbbf24] text-[9px] uppercase tracking-[0.4em] font-black mb-2">Management Zone</p>
            <h1 className="text-3xl md:text-5xl italic uppercase font-black text-white tracking-tighter leading-none">Leave Hub</h1>
          </div>
          <div className="flex gap-4 z-10 flex-wrap justify-center">
            <div className="bg-white/10 rounded-2xl px-5 py-3 text-center border border-white/10">
              <p className="text-2xl font-black text-white">{pending.length}</p>
              <p className="text-[8px] uppercase tracking-widest text-amber-400 font-black">Pending</p>
            </div>
            <div className="bg-white/10 rounded-2xl px-5 py-3 text-center border border-white/10">
              <p className="text-2xl font-black text-white">{allLeaves.length}</p>
              <p className="text-[8px] uppercase tracking-widest text-slate-400 font-black">Total Records</p>
            </div>
            <button onClick={loadLeaves}
              className="bg-white/10 rounded-2xl px-4 py-3 border border-white/10 text-white text-xl hover:bg-white/20 transition-all">↻</button>
          </div>
        </div>

        {/* MAIN TABS */}
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 gap-1">
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`flex-1 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2
                ${tab===t.id?'bg-slate-950 text-white shadow-md':'text-slate-400 hover:text-slate-700'}`}>
              {t.label}
              {t.badge!==null&&t.badge>0&&(
                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black
                  ${tab===t.id?'bg-[#fbbf24] text-slate-950':'bg-slate-100 text-slate-500'}`}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* ══ QUEUE ══ */}
        {tab==="QUEUE"&&(
          <div className="space-y-5">
            {pending.length===0?(
              <div className="py-24 text-center">
                <p className="text-6xl mb-4">✅</p>
                <p className="font-black uppercase italic text-slate-300 text-xl tracking-widest">Queue Empty</p>
              </div>
            ):pending.map((l,i)=>(
              <div key={i} className="bg-white p-6 rounded-[2.5rem] border-b-[10px] border-slate-200 shadow-xl space-y-4 hover:border-[#fbbf24] transition-all">
                <div className="flex justify-between items-center">
                  <span className="bg-amber-100 text-amber-700 text-[8px] px-3 py-1 rounded-full font-black uppercase">{l.User_Type}</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase">{l.Date_Applied}</span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl shrink-0">
                    {l.User_Type==="STUDENT"?"🎓":"👔"}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl font-black italic uppercase text-slate-950 leading-none truncate">{l.Name}</h3>
                    <p className="text-[9px] text-slate-400 font-black uppercase mt-1">ID: {l.User_ID} · {l.Leave_Type}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-2xl font-black text-slate-950">{l.Total_Days}</p>
                    <p className="text-[8px] uppercase text-slate-400 font-black">days</p>
                  </div>
                </div>
                <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 text-sm italic text-slate-600">"{l.Reason}"</div>
                <p className="text-[9px] font-black text-slate-400 uppercase">
                  📅 {l.Start_Date} → {l.End_Date}
                  {l.Reporter_Name&&l.Reporter_Name!=="-"&&(
                    <span className="ml-3">· By: {l.Reporter_Name} ({l.Relationship}) {l.Phone}</span>
                  )}
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button onClick={()=>handleAction(l,"Approved")}
                    className="py-4 bg-emerald-500 text-white rounded-[1.5rem] font-black uppercase shadow-lg border-b-4 border-emerald-800 active:scale-95 transition-all hover:bg-emerald-600">
                    ✓ Approve
                  </button>
                  <button onClick={()=>handleAction(l,"Rejected")}
                    className="py-4 bg-rose-500 text-white rounded-[1.5rem] font-black uppercase shadow-lg border-b-4 border-rose-800 active:scale-95 transition-all hover:bg-rose-600">
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ ANALYSIS ══ */}
        {tab==="ANALYSIS"&&(
          <div className="space-y-5">

            {/* Sub-tabs */}
            <div className="flex bg-white p-1 rounded-2xl border border-slate-100 gap-1">
              {[{id:"OVERVIEW",label:"Overview 📊"},{id:"ABSENCE",label:"Absence Analysis 📋"}].map(t=>(
                <button key={t.id} onClick={()=>setATab(t.id)}
                  className={`flex-1 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all
                    ${aTab===t.id?'bg-slate-950 text-white':'text-slate-400 hover:text-slate-700'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ─ OVERVIEW ─ */}
            {aTab==="OVERVIEW"&&(
              <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  <div className="flex bg-white p-1 rounded-xl border border-slate-100 gap-1">
                    {["ALL","7D","30D","90D"].map(r=>(
                      <button key={r} onClick={()=>setRangeFilter(r)}
                        className={`px-4 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all
                          ${rangeFilter===r?'bg-slate-950 text-white':'text-slate-400 hover:text-slate-700'}`}>
                        {r==="ALL"?"All Time":r==="7D"?"7d":r==="30D"?"30d":"90d"}
                      </button>
                    ))}
                  </div>
                  <div className="flex bg-white p-1 rounded-xl border border-slate-100 gap-1">
                    {["ALL","STUDENT","STAFF"].map(t=>(
                      <button key={t} onClick={()=>setTypeFilter(t)}
                        className={`px-4 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all
                          ${typeFilter===t?'bg-slate-950 text-white':'text-slate-400 hover:text-slate-700'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    {label:"Total Leaves",value:analysisLeaves.length,icon:"📋",color:"border-indigo-300 bg-indigo-50"},
                    {label:"Total Days",value:analysisLeaves.reduce((s,l)=>s+Number(l.Total_Days||1),0),icon:"📅",color:"border-blue-300 bg-blue-50"},
                    {label:"Approved",value:analysisLeaves.filter(l=>l.Status==="Approved").length,icon:"✅",color:"border-emerald-300 bg-emerald-50"},
                  ].map((s,i)=>(
                    <div key={i} className={`${s.color} p-5 rounded-[2rem] border-b-[6px] shadow-md flex flex-col items-center gap-2`}>
                      <span className="text-2xl">{s.icon}</span>
                      <p className="text-2xl font-black text-slate-950 leading-none">{s.value}</p>
                      <p className="text-[8px] uppercase tracking-widest font-black text-slate-500 text-center">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border-b-[8px] border-slate-200 shadow-xl">
                  <h3 className="text-xs uppercase tracking-[0.3em] font-black text-slate-400 mb-6">Monthly Trend (6 Months)</h3>
                  <div className="flex items-end gap-3 h-32">
                    {monthlyData.map((m,i)=>(
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <p className="text-[9px] font-black text-slate-600">{m.count>0?m.count:""}</p>
                        <div className="w-full rounded-t-xl bg-slate-950 transition-all duration-500"
                          style={{height:`${Math.max((m.count/maxMonth)*96,m.count>0?8:4)}px`}}/>
                        <p className="text-[8px] uppercase font-black text-slate-400">{m.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border-b-[8px] border-slate-200 shadow-xl">
                  <h3 className="text-xs uppercase tracking-[0.3em] font-black text-slate-400 mb-6">Leave Type Breakdown</h3>
                  {leaveTypes.length===0?<p className="text-center text-slate-300 italic py-8">No data</p>
                    :<div className="space-y-4">{leaveTypes.map(([type,count],i)=>(
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-black text-slate-700 uppercase italic truncate pr-4">{type}</span>
                          <span className="text-sm font-black text-slate-950 shrink-0">{count}</span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-950 rounded-full transition-all duration-700"
                            style={{width:`${(count/maxTypeCount)*100}%`}}/>
                        </div>
                      </div>
                    ))}</div>
                  }
                </div>
                <div className="bg-slate-950 p-6 rounded-[2.5rem] border-b-[8px] border-[#fbbf24] shadow-2xl">
                  <h3 className="text-xs uppercase tracking-[0.3em] font-black text-[#fbbf24] mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-[#fbbf24] rounded-full"/>Top Leave Takers
                  </h3>
                  {topLeaves.length===0?<p className="text-center text-white/20 italic py-8 text-sm">No data</p>
                    :<div className="space-y-3">{topLeaves.map((p,i)=>(
                      <div key={i} className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <span className={`text-lg font-black shrink-0 ${i===0?'text-[#fbbf24]':i===1?'text-slate-300':i===2?'text-amber-600':'text-white/30'}`}>#{i+1}</span>
                          <div className="min-w-0">
                            <p className="text-white font-black uppercase italic text-sm truncate">{p.name}</p>
                            <p className="text-[8px] uppercase font-black text-slate-500 mt-0.5">{p.type}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[#fbbf24] font-black text-lg leading-none">{p.days}</p>
                          <p className="text-[8px] uppercase font-black text-slate-500">days · {p.count}x</p>
                        </div>
                      </div>
                    ))}</div>
                  }
                </div>
              </div>
            )}

            {/* ─ ABSENCE ANALYSIS ─ */}
            {aTab==="ABSENCE"&&(
              <div className="space-y-5">

                {/* Filters */}
                <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    {["ALL","STUDENT","STAFF"].map(u=>(
                      <button key={u} onClick={()=>{setUFilter(u);if(u!=='STUDENT')setGradeFilter('ALL');}}
                        className={`px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all
                          ${uFilter===u?'bg-slate-950 text-white':'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                        {u==='ALL'?'ခြုံငုံ':u==='STUDENT'?'🎓 ကျောင်းသား':'👔 ဝန်ထမ်း'}
                      </button>
                    ))}
                  </div>
                  {uFilter!=='STAFF'&&allGrades.length>1&&(
                    <div className="flex gap-2 flex-wrap">
                      {allGrades.map(g=>(
                        <button key={g} onClick={()=>setGradeFilter(g)}
                          className={`px-4 py-1.5 rounded-lg font-black text-[8px] uppercase tracking-widest transition-all
                            ${gradeFilter===g?'bg-indigo-600 text-white':'bg-indigo-50 text-indigo-400 hover:bg-indigo-100'}`}>
                          {g==='ALL'?'All Grades':g}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={()=>setAbView('TOTAL')}
                      className={`flex-1 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all
                        ${abView==='TOTAL'?'bg-rose-600 text-white':'bg-rose-50 text-rose-400 hover:bg-rose-100'}`}>
                      📊 စုစုပေါင်းပျက်ချိန်
                    </button>
                    <button onClick={()=>setAbView('CONSEC')}
                      className={`flex-1 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all
                        ${abView==='CONSEC'?'bg-violet-600 text-white':'bg-violet-50 text-violet-400 hover:bg-violet-100'}`}>
                      📅 ဆက်တိုက်ပျက်ချိန်
                    </button>
                  </div>
                </div>

                {/* ── Selection toolbar ── */}
                <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 flex-wrap">
                  <span className="text-[9px] uppercase font-black text-slate-500 tracking-widest shrink-0">
                    {selected.size > 0 ? `${selected.size} ယောက် ရွေးထားသည်` : 'ကြည့်/print ချင်သူများ ☑️ ထောက်ပါ'}
                  </span>
                  <div className="flex gap-2 flex-wrap flex-1">
                    {/* Select all current visible */}
                    <button onClick={()=>{
                      const names = abView==='TOTAL'
                        ? absenceData.total2plus.map(p=>p.name)
                        : absenceData.consecGroups.flatMap(g=>g.records.map(r=>r.Name||'Unknown'));
                      selectAll([...new Set(names)]);
                    }}
                      className="px-3 py-1.5 rounded-lg font-black text-[8px] uppercase tracking-widest bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">
                      ✓ အားလုံးရွေး
                    </button>
                    {selected.size > 0 && (
                      <>
                        <button onClick={()=>setViewMode(v=>!v)}
                          className={`px-3 py-1.5 rounded-lg font-black text-[8px] uppercase tracking-widest transition-all
                            ${viewMode?'bg-indigo-600 text-white':'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}>
                          {viewMode?'👁 ပြနေသည်':'👁 ရွေးထားသူပဲ ကြည့်'}
                        </button>
                        <button onClick={handlePrint}
                          className="px-3 py-1.5 rounded-lg font-black text-[8px] uppercase tracking-widest bg-slate-800 text-white hover:bg-slate-700 transition-all">
                          🖨️ Print ထုတ်
                        </button>
                        <button onClick={clearAll}
                          className="px-3 py-1.5 rounded-lg font-black text-[8px] uppercase tracking-widest bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all">
                          ✕ ရှင်းလင်း
                        </button>
                      </>
                    )}
                    {selected.size === 0 && (
                      <button onClick={handlePrint}
                        className="px-3 py-1.5 rounded-lg font-black text-[8px] uppercase tracking-widest bg-slate-800 text-white hover:bg-slate-700 transition-all">
                        🖨️ Print (အားလုံး)
                      </button>
                    )}
                  </div>
                </div>

                {/* Printable zone */}
                <div ref={printRef}>

                  {/* ── TOTAL VIEW ── */}
                  {abView==='TOTAL'&&(
                    <div className="space-y-6">

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          {label:'2+ ရက် ပျက်',   value:absenceData.total2plus.length,  color:'border-orange-300 bg-orange-50',  icon:'📋'},
                          {label:'5+ ရက် ပျက်',   value:absenceData.total5plus.length,  color:'border-rose-300 bg-rose-50',     icon:'⚠️'},
                          {label:'10+ ရက် ပျက်',  value:absenceData.total10plus.length, color:'border-red-400 bg-red-50',       icon:'🚨'},
                        ].map((s,i)=>(
                          <div key={i} className={`${s.color} p-4 rounded-[2rem] border-b-[6px] shadow-md flex flex-col items-center gap-1`}>
                            <span className="text-xl">{s.icon}</span>
                            <p className="text-2xl font-black text-slate-950">{s.value}</p>
                            <p className="text-[7px] uppercase tracking-widest font-black text-slate-500 text-center">{s.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Grade breakdown */}
                      {(uFilter==='STUDENT'||uFilter==='ALL')&&absenceData.byGrade.filter(g=>g.grade&&g.grade!=='Unknown').length>0&&(
                        <div className="bg-slate-950 p-5 rounded-[2.5rem] border-b-[8px] border-[#fbbf24] shadow-2xl">
                          <h3 className="text-[9px] uppercase tracking-[0.3em] font-black text-[#fbbf24] mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-[#fbbf24] rounded-full"/>အတန်းအလိုက် ခွဲခြမ်းစိတ်ဖြာချက်
                          </h3>
                          <div className="space-y-2">
                            {absenceData.byGrade.filter(g=>g.grade&&g.grade!=='Unknown').map((g,i)=>(
                              <div key={i} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                                <span className="text-white font-black text-sm uppercase italic">{g.grade}</span>
                                <div className="flex gap-5">
                                  <div className="text-center"><p className="text-[#fbbf24] font-black text-lg leading-none">{g.totalDays}</p><p className="text-[7px] uppercase font-black text-slate-500">days</p></div>
                                  <div className="text-center"><p className="text-white font-black text-lg leading-none">{g.people}</p><p className="text-[7px] uppercase font-black text-slate-500">people</p></div>
                                  <div className="text-center"><p className="text-slate-300 font-black text-lg leading-none">{g.records}</p><p className="text-[7px] uppercase font-black text-slate-500">records</p></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 2+, 5+, 10+ groups */}
                      {[
                        {title:'2 ရက်နဲ့ အထက် ပျက်သူများ',  persons:absenceData.total2plus,  borderColor:'#f97316'},
                        {title:'5 ရက်နဲ့ အထက် ပျက်သူများ',  persons:absenceData.total5plus,  borderColor:'#f43f5e'},
                        {title:'10 ရက်နဲ့ အထက် ပျက်သူများ', persons:absenceData.total10plus, borderColor:'#dc2626'},
                      ].map((group,gi)=>visiblePersons(group.persons).length>0&&(
                        <div key={gi}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="h-4 w-1.5 rounded-full" style={{background:group.borderColor}}/>
                            <h3 className="text-xs uppercase tracking-widest font-black text-slate-800">{group.title}</h3>
                            <span className="text-[8px] px-2.5 py-1 rounded-full font-black uppercase bg-slate-100 text-slate-600">
                              {visiblePersons(group.persons).length} ယောက်
                            </span>
                          </div>
                          {visiblePersons(group.persons).map((person,pi)=>(
                            <PersonCard key={pi} person={person} rank={pi}/>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── CONSECUTIVE VIEW ── */}
                  {abView==='CONSEC'&&(
                    <div className="space-y-6">
                      {/* Summary */}
                      <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
                        <p className="text-[9px] uppercase tracking-widest font-black text-slate-400 mb-3">
                          ဆက်တိုက် ပျက်ချိန် ခြုံငုံ
                        </p>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                          {[2,3,4,5,6,'7+'].map((n,i)=>{
                            const group = absenceData.consecGroups[i];
                            const cnt   = group?.records?.length||0;
                            const colors = ['#fef3c7','#fde68a','#fed7aa','#fecaca','#fca5a5','#f87171'];
                            const textColors = ['#92400e','#78350f','#9a3412','#991b1b','#7f1d1d','#7f1d1d'];
                            return (
                              <div key={n} style={{background:colors[i],borderRadius:12,padding:'8px 6px',textAlign:'center',border:`2px solid ${textColors[i]}22`}}>
                                <p style={{fontSize:16,fontWeight:900,color:textColors[i]}}>{cnt}</p>
                                <p style={{fontSize:8,fontWeight:700,color:textColors[i],textTransform:'uppercase',letterSpacing:'0.04em'}}>{n} ရက်</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {absenceData.consecGroups.map((group,gi)=>(
                        <div key={gi}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`h-4 w-1.5 rounded-full
                              ${gi<2?'bg-amber-400':gi<4?'bg-orange-500':'bg-rose-600'}`}/>
                            <h3 className="text-xs uppercase tracking-widest font-black text-slate-800">{group.label}</h3>
                            <span className={`text-[8px] px-2.5 py-1 rounded-full font-black uppercase
                              ${gi<2?'bg-amber-100 text-amber-700':gi<4?'bg-orange-100 text-orange-700':'bg-rose-100 text-rose-700'}`}>
                              {group.records.length} မှတ်တမ်း
                            </span>
                          </div>
                          {group.records.length===0?(
                            <div className="bg-white rounded-2xl p-6 text-center border border-slate-100">
                              <p className="text-slate-300 italic font-black text-sm">မှတ်တမ်း မရှိပါ</p>
                            </div>
                          ):(
                            visibleRecords(group.records).length===0?(
                              <div className="bg-white rounded-2xl p-6 text-center border border-slate-100">
                                <p className="text-slate-400 italic font-black text-sm">ရွေးထားသူ ဒီ group မှာ မပါပါ</p>
                              </div>
                            ):(
                              visibleRecords(group.records).map((record,ri)=>(
                                <ConsecCard key={ri} record={record} cardKey={`${gi}_${ri}`}/>
                              ))
                            )
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                </div>{/* end printRef */}
              </div>
            )}
          </div>
        )}

        {/* ══ HISTORY ══ */}
        {tab==="HISTORY"&&(
          <div className="space-y-4">
            {history.length===0?(
              <div className="py-24 text-center">
                <p className="font-black uppercase italic text-slate-300 text-xl tracking-widest">No history yet</p>
              </div>
            ):history.slice().reverse().map((l,i)=>(
              <div key={i} className="bg-white p-5 rounded-[2rem] border-b-[6px] border-slate-100 shadow-md flex items-center gap-4">
                <div className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center text-lg
                  ${l.Status==="Approved"?"bg-emerald-100":"bg-rose-100"}`}>
                  {l.Status==="Approved"?"✅":"❌"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black uppercase italic text-sm text-slate-950 truncate">{l.Name}</p>
                  <p className="text-[9px] uppercase font-black text-slate-400 mt-0.5">
                    {l.Leave_Type} · {l.Total_Days} days · {l.Start_Date}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className={`text-[8px] px-3 py-1 rounded-full font-black uppercase
                    ${l.Status==="Approved"?"bg-emerald-100 text-emerald-700":"bg-rose-100 text-rose-700"}`}>
                    {l.Status}
                  </span>
                  {l.Approved_By&&l.Approved_By!=="-"&&(
                    <p className="text-[7px] text-slate-400 font-black uppercase mt-1">by {l.Approved_By}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
