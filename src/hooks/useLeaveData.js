import { useState, useEffect, useMemo } from 'react';
import { WEB_APP_URL } from '@/lib/api';
import { formatMMDate, getTodayMM } from '@/components/leave/DateHelpers';

export default function useLeaveData() {
  const [allLeaves, setAllLeaves] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [configs, setConfigs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaves = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'getInitialData' })
      });
      const r = await res.json();
      if (r.success) {
        setAllLeaves((r.leaves || []).map((l, i) => ({ ...l, _rowIndex: i + 2 })));
        setConfigs(r.configs || {});
        const active = s => String(s.Status || 'TRUE').toUpperCase() !== 'FALSE';
        setAllStaff((r.staffList || r.staff || []).filter(active));
        setAllStudents((r.students || []).filter(active));
      } else {
        setError(r.message);
      }
    } catch (e) {
      console.error("Fetch Error:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  // Calculate user statistics - မူလကုတ်ကအတိုင်း အပြည့်အစုံ
  const userStats = useMemo(() => {
    const stats = {};
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneQuarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    allLeaves.filter(l => l.Status === 'Approved').forEach(l => {
      const k = l.User_ID || l.Name;
      if (!stats[k]) {
        stats[k] = { 
          name: l.Name, 
          type: l.User_Type, 
          id: l.User_ID || '-', 
          totalDays: 0, 
          consecutiveMax: 0,
          weekCount: 0,
          monthCount: 0,
          quarterCount: 0,
          yearCount: 0,
          reasons: [],
          periods: [],
          leaveTypes: {},
          grade: '',
          section: '',
          enrollmentNo: '',
          department: ''
        };
      }

      const cleanS = formatMMDate(l.Start_Date);
      const cleanE = formatMMDate(l.End_Date) || cleanS;
      const days = Number(l.Total_Days) || 0;
      const leaveDate = new Date(cleanS);

      stats[k].totalDays += days;
      stats[k].reasons.push({ 
        start: cleanS, 
        end: cleanE, 
        text: l.Reason, 
        type: l.Leave_Type, 
        attachment: l.Attachment_Link 
      });
      
      stats[k].leaveTypes[l.Leave_Type] = (stats[k].leaveTypes[l.Leave_Type] || 0) + days;

      if (leaveDate >= oneWeekAgo) stats[k].weekCount += days;
      if (leaveDate >= oneMonthAgo) stats[k].monthCount += days;
      if (leaveDate >= oneQuarterAgo) stats[k].quarterCount += days;

      stats[k].periods.push({ start: new Date(cleanS).getTime(), days });
    });

    Object.values(stats).forEach(u => {
      u.periods.sort((a, b) => a.start - b.start);
      let current = 0;
      let lastEnd = 0;
      
      u.periods.forEach(p => {
        if (lastEnd === 0) {
          current = p.days;
        } else {
          const gap = (p.start - lastEnd) / 86400000;
          if (gap <= 3) {
            current += p.days;
          } else {
            current = p.days;
          }
        }
        if (current > u.consecutiveMax) u.consecutiveMax = current;
        lastEnd = p.start + (p.days * 86400000);
      });

      if (u.type === 'STUDENT') {
        const student = allStudents.find(s => s.Student_ID === u.id || s['Enrollment No.'] === u.id || s.Name === u.name);
        if (student) {
          u.grade = student.Grade || '';
          u.section = student.Section || student.Class || '';
          u.enrollmentNo = student['Enrollment No.'] || '';
        }
      } else {
        const staff = allStaff.find(s => s.Staff_ID === u.id || s.Name === u.name);
        if (staff) {
          u.department = staff.Department || '';
        }
      }

      u.reasons.sort((a, b) => new Date(b.start) - new Date(a.start));
    });

    return stats;
  }, [allLeaves, allStudents, allStaff]);

  const statsList = Object.values(userStats);
  const pending = allLeaves.filter(x => x.Status === "Pending");

  // Today's absent users - မူလကုတ်ကအတိုင်း
  const getTodayAbsentUsers = useMemo(() => {
    const today = getTodayMM();
    
    const todayLeaves = allLeaves.filter(l => 
      l.Status === 'Approved' && 
      formatMMDate(l.Start_Date) <= today && 
      formatMMDate(l.End_Date || l.Start_Date) >= today
    );

    const userMap = new Map();
    
    todayLeaves.forEach(leave => {
      const userId = leave.User_ID || leave.Name;
      if (!userMap.has(userId)) {
        const userStat = statsList.find(s => s.id === userId || s.name === leave.Name);
        
        userMap.set(userId, {
          name: leave.Name,
          id: userId,
          type: leave.User_Type,
          grade: userStat?.grade || '',
          section: userStat?.section || '',
          totalDays: userStat?.totalDays || 0,
          consecutiveMax: userStat?.consecutiveMax || 0,
          weekCount: userStat?.weekCount || 0,
          monthCount: userStat?.monthCount || 0,
          quarterCount: userStat?.quarterCount || 0,
          enrollmentNo: userStat?.enrollmentNo || '',
          department: userStat?.department || '',
          stats: userStat,
          todayReason: {
            start: formatMMDate(leave.Start_Date),
            end: formatMMDate(leave.End_Date || leave.Start_Date),
            text: leave.Reason,
            type: leave.Leave_Type,
            attachment: leave.Attachment_Link
          }
        });
      }
    });

    return Array.from(userMap.values());
  }, [allLeaves, statsList]);

  const getTodayAbsentCount = getTodayAbsentUsers.length;

  // High risk users (3+ consecutive days)
  const highRiskUsers = useMemo(() => {
    return statsList.filter(u => u.consecutiveMax >= 3);
  }, [statsList]);

  // Top absentees
  const topAbsentees = useMemo(() => {
    return [...statsList]
      .filter(u => u.type === 'STUDENT')
      .sort((a, b) => b.totalDays - a.totalDays)
      .slice(0, 20);
  }, [statsList]);

  return {
    allLeaves,
    allStaff,
    allStudents,
    configs,
    loading,
    error,
    fetchLeaves,
    userStats,
    statsList,
    pending,
    getTodayAbsentUsers,
    getTodayAbsentCount,
    highRiskUsers,
    topAbsentees,
    WEB_APP_URL
  };
}