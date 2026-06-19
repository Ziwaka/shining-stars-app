"use client";
import { useEffect, useState } from 'react';
import { WEB_APP_URL } from '@/lib/api';

const MM_TZ = 'Asia/Yangon';

// ── 1. DATE UTILITIES ─────────────────────────────────────────

export const formatMMDate = (d) => {
  if (!d || d === '-') return '-';
  try {
    if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.trim())) return d.trim();
    const dateObj = new Date(d);
    if (!isNaN(dateObj.getTime())) return dateObj.toLocaleDateString('en-CA', { timeZone: MM_TZ });
  } catch (e) {}
  return String(d).split('T')[0];
};

export const formatDateDisplay = (d) => {
  if (!d || d === '-') return '-';
  try {
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return d;
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short', timeZone: MM_TZ });
    return `${day}/${month}/${year}, ${weekday}`;
  } catch(e) { 
    return formatMMDate(d); 
  }
};

// ── 2. ATTENDANCE CALENDAR (with numbers: students / staff) ──

// ── 2. ATTENDANCE CALENDAR (with fallback to absent count) ──

export const AttendanceCalendar = ({ trendData, onDayClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Yangon',month:'numeric'}).format(new Date())-1|0);
  const [currentYear, setCurrentYear] = useState(parseInt(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Yangon',year:'numeric'}).format(new Date()),10));

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Build a map of date -> absent count (use absentStudents if available, otherwise fallback to total absent)
  const absentMap = {};
  if (trendData && Array.isArray(trendData)) {
    trendData.forEach(item => {
      if (item.date) {
        // If detailed data available, use it; otherwise fallback to total absent
        absentMap[item.date] = {
          students: item.absentStudents !== undefined ? item.absentStudents : (item.absent || 0),
          staff: item.absentStaff !== undefined ? item.absentStaff : 0
        };
      }
    });
  }

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDayClick = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onDayClick?.(dateStr);
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-black text-slate-900">Attendance Calendar</h3>
          <div className="flex gap-3 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Absent</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200">←</button>
          <span className="px-4 py-1 bg-slate-100 rounded-full text-sm font-bold">{months[currentMonth]} {currentYear}</span>
          <button onClick={nextMonth} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200">→</button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Weekday Headers */}
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="text-center text-[10px] font-black text-slate-400 uppercase py-2">{day}</div>
        ))}

        {/* Empty cells for first day */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square p-1"></div>
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const counts = absentMap[dateStr] || { students: 0, staff: 0 };
          const totalAbsent = counts.students + counts.staff;
          
          return (
            <div key={day} className="aspect-square p-1 cursor-pointer" onClick={() => handleDayClick(day)}>
              <div className="w-full h-full rounded-xl border-2 border-slate-200 bg-white flex flex-col items-center justify-center hover:border-amber-300 transition-all p-1">
                <span className="text-xs font-black text-slate-700">{day}</span>
                {totalAbsent > 0 ? (
                  <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full mt-0.5">
                    {totalAbsent}
                  </span>
                ) : (
                  <span className="text-[8px] text-slate-300 mt-0.5">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── 3. EVENT CALENDAR ──────────────────────────────────

export const EventCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Yangon',month:'numeric'}).format(new Date())-1|0);
  const [currentYear, setCurrentYear] = useState(parseInt(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Yangon',year:'numeric'}).format(new Date()),10));
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  useEffect(() => {
    setLoading(true);
    fetch(WEB_APP_URL, {
      method: 'POST',
      body: JSON.stringify({ 
        action: 'getEvents', 
        month: `${currentYear}-${String(currentMonth+1).padStart(2,'0')}` // YYYY-MM format
      })
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) setEvents(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [currentMonth, currentYear]);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getDayEvents = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.Date === dateStr || e.Start_Date === dateStr);
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-black text-slate-900">Event Calendar</h3>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200">←</button>
          <span className="px-4 py-1 bg-slate-100 rounded-full text-sm font-bold">{months[currentMonth]} {currentYear}</span>
          <button onClick={nextMonth} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200">→</button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-400">Loading events...</div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-center text-[10px] font-black text-slate-400 uppercase py-2">{day}</div>
            ))}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square p-1"></div>
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getDayEvents(day);
              return (
                <div key={day} className="aspect-square p-1">
                  <div className="w-full h-full rounded-xl border-2 border-slate-100 flex flex-col items-center justify-center hover:border-indigo-200 transition-colors relative">
                    <span className="text-xs font-black">{day}</span>
                    {dayEvents.length > 0 && (
                      <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-0.5">
                        {dayEvents.slice(0, 3).map((ev, idx) => (
                          <span key={idx} className="w-1 h-1 rounded-full bg-indigo-500"></span>
                        ))}
                        {dayEvents.length > 3 && <span className="text-[6px] font-bold text-indigo-500">+{dayEvents.length-3}</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {events.length === 0 && (
            <p className="text-center text-[10px] text-slate-400 mt-6">No events this month</p>
          )}
        </>
      )}
    </div>
  );
};

// ── 4. ATTENDANCE STATS CARDS ───────────────────────────────

export const AttendanceStats = ({ data }) => {
  if (!data) return null;

  const stats = [
    { 
      label: 'Students', 
      present: data.school?.present || 0, 
      absent: data.school?.absent || 0, 
      pending: data.school?.pending || 0,
      total: data.school?.total || 0,
      color: 'blue'
    },
    { 
      label: 'Staff', 
      present: data.staff?.present || 0, 
      absent: data.staff?.absent || 0, 
      pending: data.staff?.pending || 0,
      total: data.staff?.total || 0,
      color: 'purple'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {stats.map((stat, idx) => {
        const presentPercent = stat.total > 0 ? Math.round((stat.present / stat.total) * 100) : 0;
        const absentPercent = stat.total > 0 ? Math.round((stat.absent / stat.total) * 100) : 0;
        const pendingPercent = stat.total > 0 ? Math.round((stat.pending / stat.total) * 100) : 0;

        return (
          <div key={idx} className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-black text-slate-900">{stat.label}</h4>
              <span className="text-xs font-bold text-slate-500">Total: {stat.total}</span>
            </div>
            
            {/* Main Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2 bg-emerald-50 rounded-xl">
                <p className="text-xl font-black text-emerald-600">{stat.present}</p>
                <p className="text-[9px] font-bold text-emerald-700 uppercase">ရှိ</p>
              </div>
              <div className="text-center p-2 bg-rose-50 rounded-xl">
                <p className="text-xl font-black text-rose-600">{stat.absent}</p>
                <p className="text-[9px] font-bold text-rose-700 uppercase">ပျက်</p>
              </div>
              <div className="text-center p-2 bg-amber-50 rounded-xl">
                <p className="text-xl font-black text-amber-600">{stat.pending}</p>
                <p className="text-[9px] font-bold text-amber-700 uppercase">ဆိုင်း</p>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[8px] font-bold mb-1">
                  <span className="text-emerald-600">ရှိ {presentPercent}%</span>
                  <span className="text-rose-600">ပျက် {absentPercent}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-500" style={{ width: `${presentPercent}%` }} />
                  <div className="h-full bg-rose-500" style={{ width: `${absentPercent}%` }} />
                  <div className="h-full bg-amber-500" style={{ width: `${pendingPercent}%` }} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── 5. ABSENT MODAL ──────────────────────────────

export function AbsentModal({ persons, title, onClose }) {
  if (!persons || persons.length === 0) return null;

  const groupedByStatus = {
    approved: persons.filter(p => p.status === 'Approved'),
    pending: persons.filter(p => p.status === 'Pending')
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4" onClick={onClose}>
      <div className="bg-white w-full md:w-[600px] rounded-t-[2.5rem] md:rounded-[2.5rem] p-6 shadow-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center md:hidden mb-4"><div className="w-12 h-1.5 bg-slate-200 rounded-full"/></div>
        
        <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-1">Attendance Detail</p>
            <h3 className="text-xl font-black text-slate-900 leading-none">{title}</h3>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 font-black text-lg flex items-center justify-center hover:bg-slate-200">✕</button>
        </div>

        {/* Summary Tabs */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 bg-emerald-50 rounded-xl p-3 text-center">
            <p className="text-xs text-emerald-600 font-black">{groupedByStatus.approved.length}</p>
            <p className="text-[8px] text-emerald-700 font-bold uppercase">Approved</p>
          </div>
          <div className="flex-1 bg-amber-50 rounded-xl p-3 text-center">
            <p className="text-xs text-amber-600 font-black">{groupedByStatus.pending.length}</p>
            <p className="text-[8px] text-amber-700 font-bold uppercase">Pending</p>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-200">
          {groupedByStatus.approved.map((p, i) => (
            <PersonCard key={`approved-${i}`} person={p} />
          ))}
          {groupedByStatus.pending.map((p, i) => (
            <PersonCard key={`pending-${i}`} person={p} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PersonCard({ person }) {
  return (
    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${person.status === 'Approved' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
            {person.grade ? '🎓' : '👔'}
          </div>
          <div>
            <p className="font-black text-slate-900 text-[15px]">{person.name || person.id}</p>
            {person.grade && (
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                Grade {person.grade}{person.section ? ` · ${person.section}` : ''}
              </p>
            )}
          </div>
        </div>
        <span className={`text-[9px] uppercase font-black px-3 py-1 rounded-lg shadow-sm border ${
          person.status === 'Approved' 
            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
            : 'bg-amber-50 text-amber-600 border-amber-100'
        }`}>
          {person.status}
        </span>
      </div>

      <div className="bg-white p-3 rounded-xl border border-slate-100">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase">
            {person.leave_type || 'Leave'}
          </span>
          <span className="text-[10px] font-bold text-slate-500">
            📅 {formatDateDisplay(person.start_date)}
            {person.end_date && person.end_date !== person.start_date ? ` → ${formatDateDisplay(person.end_date)}` : ''}
          </span>
        </div>
        {person.reason && person.reason !== '-' && (
          <p className="text-[12px] text-slate-600 italic leading-snug">"{person.reason}"</p>
        )}
      </div>
    </div>
  );
}

// ── 6. TREND CHART (Improved) ────────────────────────────────

export const TrendChart = ({ trend }) => {
  if (!trend || trend.length === 0) {
    return <div className="h-full flex items-center justify-center text-[10px] text-white/50">No data available</div>;
  }

  // Calculate max percentage for scaling
  const maxPct = Math.max(...trend.map(t => t.pct), 10);

  return (
    <div className="flex-1 flex items-end gap-1 relative">
      {trend.map((t, i) => (
        <div key={i} className="group relative flex-1 flex flex-col items-center justify-end h-full">
          {/* Tooltip */}
          <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-white text-slate-950 text-[9px] py-1.5 px-3 rounded-lg font-black whitespace-nowrap z-20 pointer-events-none transition-opacity shadow-xl">
            {t.label}: {t.pct}% (S:{t.absentStudents} · T:{t.absentStaff})
          </div>
          {/* Bar with gradient */}
          <div 
            className="w-full rounded-t-sm transition-all duration-500 hover:brightness-110"
            style={{
              height: `${(t.pct / maxPct) * 100}%`,
              background: t.pct >= 90 
                ? 'linear-gradient(180deg, #34d399 0%, #10b981 100%)' 
                : t.pct >= 70
                ? 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)'
                : 'linear-gradient(180deg, #f87171 0%, #ef4444 100%)',
              minHeight: '4px'
            }}
          />
        </div>
      ))}
    </div>
  );
};

// ── 7. MAIN COMPONENT ───────────────────────────────────────
