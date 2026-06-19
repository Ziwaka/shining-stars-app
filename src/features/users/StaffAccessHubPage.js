"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_APP_URL } from '@/lib/api';
import { hasPerm } from '@/lib/permissions';
import { clearStoredUser, readStoredUser, saveStoredUser } from '@/features/users/auth';
import {
  AbsentModal,
  AttendanceCalendar,
  AttendanceStats,
  EventCalendar,
  TrendChart,
  formatDateDisplay
} from '@/features/attendance/components';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

/* ─────────────────────────────────────────────
   STUDENT DIRECTORY HELPERS
   (UNCHANGED — same as original)
───────────────────────────────────────────── */

function getValue(row, keys) {
  if (!row) return '';
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
      return String(row[key]).trim();
    }
  }
  return '';
}

function getStudentId(row) {
  return getValue(row, [
    'Enrollment No.',
    'Enrollment_No',
    'Student_ID',
    'Student ID',
    'ID',
    'Username'
  ]);
}

function getStudentName(row) {
  return getValue(row, [
    'Name (ALL CAPITAL)',
    'Name',
    'Student_Name',
    'Student Name',
    'Full_Name',
    'Full Name'
  ]);
}

function getGrade(row) {
  return getValue(row, [
    'Grade',
    'grade',
    'Class_Grade',
    'Class Grade',
    'အတန်း'
  ]) || 'Unknown';
}

function getSection(row) {
  const grade = getGrade(row);
  const section = getValue(row, [
    'Section',
    'section',
    'Class',
    'class',
    'Room',
    'အခန်း'
  ]);

  if (!section) return '—';
  if (String(section).trim().toLowerCase() === String(grade).trim().toLowerCase()) return '—';
  return section;
}

function getSex(row) {
  const raw = getValue(row, [
    'Sex',
    'Gender',
    'gender',
    'ကျား/မ',
    'Male/Female'
  ]);

  const lower = raw.toLowerCase();

  if (
    lower === 'f' ||
    lower === 'female' ||
    lower === 'girl' ||
    lower === 'girls' ||
    raw === 'မ' ||
    raw.includes('မိန်း')
  ) {
    return 'female';
  }

  if (
    lower === 'm' ||
    lower === 'male' ||
    lower === 'boy' ||
    lower === 'boys' ||
    raw === 'ကျား' ||
    raw.includes('ကျား')
  ) {
    return 'male';
  }

  return 'unknown';
}

function isHostelStudent(row) {
  const raw = getValue(row, [
    'School/Hostel',
    'School_Hostel',
    'Hostel',
    'Residence',
    'Boarding',
    'Day/Boarding',
    'Student_Type',
    'Student Type'
  ]);

  const lower = raw.toLowerCase();

  return (
    lower.includes('hostel') ||
    lower.includes('boarding') ||
    lower.includes('boarder') ||
    raw.includes('အဆောင်')
  );
}

function hasStatusColumn(rows) {
  return rows.some(row =>
    getValue(row, ['Status', 'status', 'Active', 'active']) !== ''
  );
}

function isActiveStudent(row) {
  const raw = getValue(row, ['Status', 'status', 'Active', 'active']);
  if (!raw) return true;

  const lower = raw.toLowerCase();

  if (
    raw === 'true' ||
    raw === 'TRUE' ||
    raw === 'Active' ||
    lower === 'active' ||
    lower === 'yes' ||
    lower === '1'
  ) {
    return true;
  }

  if (
    raw === 'false' ||
    raw === 'FALSE' ||
    lower === 'inactive' ||
    lower === 'archived' ||
    lower === 'no' ||
    lower === '0'
  ) {
    return false;
  }

  return true;
}

function gradeSortValue(grade) {
  const g = String(grade || '').trim().toUpperCase();

  if (g === 'KG' || g === 'K.G') return -1;

  const n = Number(g.replace(/[^0-9]/g, ''));
  if (!Number.isNaN(n) && n > 0) return n;

  return 999;
}

function buildStudentOverview(rawStudents) {
  const rows = Array.isArray(rawStudents) ? rawStudents : [];
  const shouldFilterActive = hasStatusColumn(rows);
  const students = shouldFilterActive ? rows.filter(isActiveStudent) : rows;

  const groupMap = new Map();
  const gradeSet = new Set();

  const overall = {
    total: 0,
    male: 0,
    female: 0,
    unknownGender: 0,
    gradeCount: 0,
    sectionCount: 0,
    hostelTotal: 0,
    hostelMale: 0,
    hostelFemale: 0,
    hostelUnknownGender: 0
  };

  students.forEach(student => {
    const grade = getGrade(student);
    const section = getSection(student);
    const sex = getSex(student);
    const hostel = isHostelStudent(student);
    const key = `${grade}__${section}`;

    gradeSet.add(grade);

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        key,
        grade,
        section,
        total: 0,
        male: 0,
        female: 0,
        unknownGender: 0,
        hostelTotal: 0,
        hostelMale: 0,
        hostelFemale: 0,
        hostelUnknownGender: 0,
        students: []
      });
    }

    const group = groupMap.get(key);

    const normalizedStudent = {
      ...student,
      id: getStudentId(student),
      name: getStudentName(student),
      grade,
      section,
      sex,
      hostel,
      classKey: section && section !== '—' ? `${grade} - ${section}` : grade
    };

    group.total += 1;
    overall.total += 1;

    if (sex === 'male') {
      group.male += 1;
      overall.male += 1;
    } else if (sex === 'female') {
      group.female += 1;
      overall.female += 1;
    } else {
      group.unknownGender += 1;
      overall.unknownGender += 1;
    }

    if (hostel) {
      group.hostelTotal += 1;
      overall.hostelTotal += 1;

      if (sex === 'male') {
        group.hostelMale += 1;
        overall.hostelMale += 1;
      } else if (sex === 'female') {
        group.hostelFemale += 1;
        overall.hostelFemale += 1;
      } else {
        group.hostelUnknownGender += 1;
        overall.hostelUnknownGender += 1;
      }
    }

    group.students.push(normalizedStudent);
  });

  const breakdownRows = Array.from(groupMap.values()).sort((a, b) => {
    const gradeDiff = gradeSortValue(a.grade) - gradeSortValue(b.grade);
    if (gradeDiff !== 0) return gradeDiff;
    return String(a.section).localeCompare(String(b.section));
  });

  overall.gradeCount = gradeSet.size;
  overall.sectionCount = breakdownRows.length;

  const chartData = breakdownRows.map(row => ({
    name: row.section && row.section !== '—' ? `${row.grade}-${row.section}` : `${row.grade}`,
    total: row.total,
    male: row.male,
    female: row.female,
    hostel: row.hostelTotal
  }));

  const genderPieData = [
    { name: 'ကျား', value: overall.male },
    { name: 'မ', value: overall.female }
  ];

  const hostelPieData = [
    { name: 'အဆောင် ကျား', value: overall.hostelMale },
    { name: 'အဆောင် မ', value: overall.hostelFemale }
  ];

  return {
    overall,
    rows: breakdownRows,
    chartData,
    genderPieData,
    hostelPieData
  };
}

/* ─────────────────────────────────────────────
   LOCAL MODAL FOR STUDENT DRILL-DOWN
   (UNCHANGED)
───────────────────────────────────────────── */

function StudentListModal({ title, students, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[85vh] overflow-hidden bg-white rounded-[2rem] shadow-2xl border-b-[10px] border-[#fbbf24]">
        <div className="p-5 md:p-6 bg-slate-950 text-white flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#fbbf24] font-black">
              Student List
            </div>
            <h3 className="text-xl md:text-2xl font-black italic uppercase">
              {title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-white text-slate-950 rounded-xl text-xs font-black border-b-4 border-slate-400 active:scale-95"
          >
            Close ✕
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-auto max-h-[65vh]">
          {students?.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-[10px] uppercase text-slate-500 tracking-widest">
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">အတန်း</th>
                    <th className="px-3 py-2">အခန်း</th>
                    <th className="px-3 py-2">ကျား/မ</th>
                    <th className="px-3 py-2">အဆောင်</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => (
                    <tr key={`${student.id || index}-${index}`} className="bg-slate-50 rounded-xl">
                      <td className="px-3 py-3 text-xs font-black rounded-l-xl">
                        {student.id || '—'}
                      </td>
                      <td className="px-3 py-3 text-xs font-black">
                        {student.name || '—'}
                      </td>
                      <td className="px-3 py-3 text-xs">
                        {student.grade || '—'}
                      </td>
                      <td className="px-3 py-3 text-xs">
                        {student.section || '—'}
                      </td>
                      <td className="px-3 py-3 text-xs">
                        {student.sex === 'male' ? 'ကျား' : student.sex === 'female' ? 'မ' : '—'}
                      </td>
                      <td className="px-3 py-3 text-xs rounded-r-xl">
                        {student.hostel ? 'အဆောင်နေ' : 'Day'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm font-black">
              Data မရှိသေးပါ
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STUDENT POPULATION OVERVIEW
   (UNCHANGED)
───────────────────────────────────────────── */

function MiniStatCard({ label, value, tone = 'white', sub }) {
  const toneClass =
    tone === 'dark'
      ? 'bg-slate-950 text-white border-[#fbbf24]'
      : tone === 'blue'
        ? 'bg-blue-50 text-blue-700 border-blue-100'
        : tone === 'pink'
          ? 'bg-pink-50 text-pink-700 border-pink-100'
          : tone === 'amber'
            ? 'bg-amber-50 text-amber-700 border-amber-100'
            : 'bg-white text-slate-950 border-slate-100';

  return (
    <div className={`rounded-[1.5rem] p-4 md:p-5 shadow-lg border-b-[6px] ${toneClass}`}>
      <div className="text-[9px] md:text-[10px] uppercase tracking-widest font-black opacity-60 mb-2">
        {label}
      </div>
      <div className="text-2xl md:text-3xl font-black leading-none">
        {value}
      </div>
      {sub && (
        <div className="mt-2 text-[9px] md:text-[10px] uppercase tracking-wider opacity-60">
          {sub}
        </div>
      )}
    </div>
  );
}

function StudentPopulationDashboard({ loading, overview, onOpenGroup }) {
  const overall = overview?.overall || {};
  const rows = overview?.rows || [];
  const chartData = overview?.chartData || [];
  const genderPieData = overview?.genderPieData || [];
  const hostelPieData = overview?.hostelPieData || [];

  const hasGenderPie = genderPieData.some(item => item.value > 0);
  const hasHostelPie = hostelPieData.some(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* TOP SIMPLE SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <MiniStatCard
          label="စုစုပေါင်း"
          value={loading ? '...' : overall.total ?? 0}
          sub="Active Students"
        />
        <MiniStatCard
          label="အတန်း"
          value={loading ? '...' : overall.gradeCount ?? 0}
          sub="Grade Count"
          tone="amber"
        />
        <MiniStatCard
          label="အခန်း"
          value={loading ? '...' : overall.sectionCount ?? 0}
          sub="Class / Section"
        />
        <MiniStatCard
          label="ကျား"
          value={loading ? '...' : overall.male ?? 0}
          tone="blue"
        />
        <MiniStatCard
          label="မ"
          value={loading ? '...' : overall.female ?? 0}
          tone="pink"
        />
        <MiniStatCard
          label="အဆောင်နေ"
          value={loading ? '...' : overall.hostelTotal ?? 0}
          tone="dark"
          sub={`ကျား ${overall.hostelMale ?? 0} / မ ${overall.hostelFemale ?? 0}`}
        />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-[2rem] p-5 md:p-6 shadow-xl border border-slate-100">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-sm md:text-base font-black uppercase">
                📊 အတန်း/အခန်းလိုက် ကျောင်းသားအရေအတွက်
              </h3>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
                Total / Boys / Girls / Hostel
              </p>
            </div>
          </div>

          <div className="h-[280px] md:h-[340px]">
            {loading ? (
              <div className="h-full rounded-2xl bg-slate-100 animate-pulse" />
            ) : chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fontWeight: 900 }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis tick={{ fontSize: 10, fontWeight: 900 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" name="စုစုပေါင်း" fill="#0f172a" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="male" name="ကျား" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="female" name="မ" fill="#ec4899" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="hostel" name="အဆောင်" fill="#fbbf24" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-black">
                Student_Directory data မရသေးပါ
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-[2rem] p-5 md:p-6 shadow-xl border border-slate-100">
            <h3 className="text-sm font-black uppercase mb-3">👥 ကျား / မ</h3>
            <div className="h-[180px]">
              {!loading && hasGenderPie ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderPieData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={70}
                      label
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#ec4899" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 font-black">
                  No gender data
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-950 rounded-[2rem] p-5 md:p-6 shadow-xl border-b-[8px] border-[#fbbf24] text-white">
            <h3 className="text-sm font-black uppercase mb-3 text-[#fbbf24]">🏠 အဆောင်နေ ကျား / မ</h3>
            <div className="h-[180px]">
              {!loading && hasHostelPie ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={hostelPieData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={70}
                      label
                    >
                      <Cell fill="#60a5fa" />
                      <Cell fill="#f472b6" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-white/50 font-black">
                  No hostel gender data
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CLASS / SECTION BREAKDOWN TABLE */}
      <div className="bg-white rounded-[2rem] p-5 md:p-6 shadow-xl border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-sm md:text-base font-black uppercase">
              အတန်းလိုက် / အခန်းလိုက် အသေးစိတ်
            </h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
              စုစုပေါင်း · ကျား · မ · အဆောင်နေ
            </p>
          </div>
          <div className="text-[10px] font-black uppercase text-slate-400">
            Row click → student list
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
          </div>
        ) : rows.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[9px] md:text-[10px] uppercase text-slate-400 tracking-widest">
                  <th className="px-3 py-2">အတန်း</th>
                  <th className="px-3 py-2">အခန်း</th>
                  <th className="px-3 py-2">စုစုပေါင်း</th>
                  <th className="px-3 py-2">ကျား</th>
                  <th className="px-3 py-2">မ</th>
                  <th className="px-3 py-2">အဆောင် စုစုပေါင်း</th>
                  <th className="px-3 py-2">အဆောင် ကျား</th>
                  <th className="px-3 py-2">အဆောင် မ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr
                    key={row.key}
                    onClick={() =>
                      onOpenGroup({
                        title: `${row.grade}${row.section && row.section !== '—' ? ` - ${row.section}` : ''} · Students`,
                        students: row.students
                      })
                    }
                    className="bg-slate-50 hover:bg-[#fbbf24]/10 cursor-pointer transition-all"
                  >
                    <td className="px-3 py-3 text-xs md:text-sm font-black rounded-l-xl">
                      {row.grade}
                    </td>
                    <td className="px-3 py-3 text-xs md:text-sm font-black">
                      {row.section}
                    </td>
                    <td className="px-3 py-3 text-xs md:text-sm font-black text-slate-950">
                      {row.total}
                    </td>
                    <td className="px-3 py-3 text-xs md:text-sm font-black text-blue-600">
                      {row.male}
                    </td>
                    <td className="px-3 py-3 text-xs md:text-sm font-black text-pink-600">
                      {row.female}
                    </td>
                    <td className="px-3 py-3 text-xs md:text-sm font-black text-slate-950">
                      {row.hostelTotal}
                    </td>
                    <td className="px-3 py-3 text-xs md:text-sm font-black text-blue-500">
                      {row.hostelMale}
                    </td>
                    <td className="px-3 py-3 text-xs md:text-sm font-black text-pink-500 rounded-r-xl">
                      {row.hostelFemale}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-slate-50 text-center text-xs text-slate-400 font-black">
            Student_Directory data မရသေးပါ
          </div>
        )}
      </div>
    </div>
  );
}

export default function StaffAccessHub() {
  const [user, setUser] = useState(null);
  const [att, setAtt] = useState(null);            // today's attendance
  const [trend, setTrend] = useState([]);          // trend data (30 days)
  const [studentRows, setStudentRows] = useState([]);
  const [loadingAtt, setLoadingAtt] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [modal, setModal] = useState(null);
  const router = useRouter();

  // top-level page tab — ONLY split that exists now
  const [mainTab, setMainTab] = useState('dashboard'); // 'dashboard', 'tools'

  const studentOverview = useMemo(
    () => buildStudentOverview(studentRows),
    [studentRows]
  );

  // Fetch user and initial data
  useEffect(() => {
    const auth = readStoredUser();

    if (!auth) {
      router.push('/login');
      return;
    }

    if (auth.userRole === 'management') {
      router.push('/management/mgt-dashboard');
      return;
    }

    // Fetch staff permissions (optional, but keeps consistency)
    fetch(WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'getStaffPermissions' })
    })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          const fresh = res.data.find(s =>
            (s.Staff_ID && s.Staff_ID.toString() === auth.Staff_ID?.toString()) ||
            (s.Name && s.Name === auth['Name (ALL CAPITAL)']) ||
            (s.Name && s.Name === auth.Name)
          );

          if (fresh) {
            const updated = { ...auth, ...fresh };
            saveStoredUser(updated);
            setUser(updated);
            return;
          }
        }

        setUser(auth);
      })
      .catch(() => setUser(auth));

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Yangon' });

    Promise.all([
      fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'getAttendance', date: today })
      }).then(r => r.json()).catch(() => ({ success: false })),

      fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'getAttendanceTrend' })
      }).then(r => r.json()).catch(() => ({ success: false })),

      fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'getData', sheetName: 'Student_Directory' })
      }).then(r => r.json()).catch(() => ({ success: false }))
    ])
      .then(([attRes, trendRes, studentRes]) => {
        if (attRes.success) setAtt(attRes);

        if (trendRes.success) {
          console.log('Trend response:', trendRes);
          setTrend(trendRes.trend || []);
        }

        if (studentRes.success && Array.isArray(studentRes.data)) {
          setStudentRows(studentRes.data);
        } else if (studentRes.success && Array.isArray(studentRes.students)) {
          setStudentRows(studentRes.students);
        }

        setLoadingAtt(false);
        setLoadingStudents(false);
      })
      .catch(() => {
        setLoadingAtt(false);
        setLoadingStudents(false);
      });
  }, [router]);

  // Handle day click on attendance calendar – fetch that day's attendance and show modal
  const handleDayClick = useCallback(async (date) => {
    try {
      const res = await fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'getAttendance', date })
      });

      const data = await res.json();

      if (data.success) {
        const allAbsent = [
          ...(data.absentStudents || []),
          ...(data.pendingStudents || []),
          ...(data.absentStaff || []),
          ...(data.pendingStaff || [])
        ];

        if (allAbsent.length > 0) {
          setModal({ title: formatDateDisplay(date), persons: allAbsent });
        } else {
          alert('No absences on this day.');
        }
      } else {
        alert('Could not fetch attendance for that day.');
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F0F9FF]">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-[#fbbf24] rounded-full animate-spin" />
      </div>
    );
  }

  const toolGroups = [
    {
      group: "Campus & Student Operations",
      items: [
        { name: 'Student Directory', path: '/staff/student-dir', icon: '👤', perm: null },
        { name: 'Hostel Management', path: '/staff/hostel', icon: '🏠', perm: 'Can_Manage_Hostel' },
        { name: 'House Score Adjust', path: '/staff/points', icon: '⚖️', perm: null },
      ]
    },
    {
      group: "Facilities & Transport",
      items: [
        { name: 'Vehicle Registry', path: '/staff/vehicles', icon: '🛵', perm: null },
        { name: 'Inventory', path: '/staff/inventory', icon: '📦', perm: 'Can_Manage_Inventory' },
        { name: 'Lost & Found', path: '/staff/lost-found', icon: '🔍', perm: null },
      ]
    },
    {
      group: "Staff Professional Hub",
      items: [
        { name: 'Staff Contacts', path: '/staff/contacts', icon: '📞', perm: null },
        { name: 'Master Registry', path: '/staff/staff-dir', icon: '👔', perm: 'Can_View_Staff' },
        { name: 'Leave Portal', path: '/staff/leave', icon: '📄', perm: null },
        { name: 'Vendors', path: '/staff/vendors', icon: '🤝', perm: null }
      ]
    },
    {
      group: "Administrative & Ledger",
      items: [
        { name: 'Financial Registry', path: '/staff/fees', icon: '💰', perm: 'Can_Manage_Fees' },
        { name: 'Registry Notes', path: '/staff/notes', icon: '📒', perm: null },
        { name: 'Communication', path: '/management/communication', icon: '📢', perm: 'Can_Post_Announcement' },
        { name: 'Exam Records', path: '/staff/exam-records', icon: '📝', perm: 'Can_Record_Exam' },
        { name: 'Calendar', path: '/staff/calendar', icon: '📅', perm: 'Can_Manage_Events' },
        { name: 'My Timetable', path: '/staff/timetable', icon: '🗓️', perm: null },
      ]
    }
  ];

  const handleLogout = () => {
    clearStoredUser();
    router.push('/login');
  };

  const allAbsentPersons = [
    ...(att?.absentStudents || []),
    ...(att?.pendingStudents || []),
    ...(att?.absentStaff || []),
    ...(att?.pendingStaff || [])
  ];

  const openAbsentModal = (type) => {
    let persons = [];
    let title = '';

    if (type === 'student') {
      persons = [...(att?.absentStudents || []), ...(att?.pendingStudents || [])];
      title = 'Student Absences Today';
    } else if (type === 'staff') {
      persons = [...(att?.absentStaff || []), ...(att?.pendingStaff || [])];
      title = 'Staff Absences Today';
    } else {
      persons = allAbsentPersons.filter(p => (p.classKey || 'Unknown') === (type || 'Unknown'));
      title = type && type !== 'Unknown' ? `Class ${type} — Absences` : 'Grade Unknown — Absences';
    }

    if (persons.length > 0) setModal({ title, persons });
  };

  const openStudentGroupModal = ({ title, students }) => {
    setModal({
      type: 'students',
      title,
      students
    });
  };

  return (
    <div className="h-full overflow-y-auto bg-[#F0F9FF] font-black text-slate-950 p-4 md:p-12 pb-32">
      {modal && modal.type === 'students' ? (
        <StudentListModal
          title={modal.title}
          students={modal.students}
          onClose={() => setModal(null)}
        />
      ) : modal ? (
        <AbsentModal
          title={modal.title}
          persons={modal.persons}
          onClose={() => setModal(null)}
        />
      ) : null}

      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* HEADER */}
        <div className="bg-slate-950 rounded-[3rem] p-8 md:p-14 border-b-[12px] border-[#fbbf24] shadow-2xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#fbbf24]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

          <div className="relative z-10 w-20 h-20 md:w-32 md:h-32 bg-white rounded-[2rem] flex items-center justify-center text-4xl md:text-6xl shadow-xl border-4 border-[#fbbf24] shrink-0">
            👤
          </div>

          <div className="text-center md:text-left flex-1 z-10 min-w-0">
            <div className="inline-block px-4 py-1.5 bg-[#fbbf24] text-slate-950 text-[10px] font-black uppercase rounded-lg mb-3 tracking-[0.2em]">
              Educational Staff
            </div>

            <h1 className="text-2xl md:text-5xl italic uppercase font-black text-white tracking-tighter leading-none mb-3 break-words">
              {user['Name (ALL CAPITAL)'] || user.Name || user.username}
            </h1>

            <p className="text-slate-400 text-[10px] md:text-xs uppercase font-black tracking-[0.3em]">
              ID: <span className="text-[#fbbf24]">{user.Staff_ID || user.ID || "—"}</span>
              <span className="mx-3 opacity-30">|</span>
              Status: <span className="text-white">Authorized</span>
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="relative z-50 px-6 py-3 bg-rose-600 text-white text-[10px] md:text-xs font-black uppercase rounded-2xl border-b-4 border-rose-900 active:scale-95 transition-all shrink-0 shadow-xl hover:bg-rose-700"
          >
            Logout ⏻
          </button>
        </div>

        {/* MAIN PAGE TABS: Dashboard / Tools — the ONLY tab split */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setMainTab('dashboard')}
            className={`px-6 py-3 rounded-xl font-black text-sm transition-all whitespace-nowrap ${
              mainTab === 'dashboard'
                ? 'bg-slate-950 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            📊 Dashboard
          </button>

          <button
            onClick={() => setMainTab('tools')}
            className={`px-6 py-3 rounded-xl font-black text-sm transition-all whitespace-nowrap ${
              mainTab === 'tools'
                ? 'bg-slate-950 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            🧰 Tools
          </button>
        </div>

        {/* ===================== DASHBOARD PAGE ===================== */}
        {mainTab === 'dashboard' && (
          <div className="space-y-8">

            {/* Student Population Overview */}
            <StudentPopulationDashboard
              loading={loadingStudents}
              overview={studentOverview}
              onOpenGroup={openStudentGroupModal}
            />

            {/* Attendance — Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Stats Cards */}
              <div className="lg:col-span-1 space-y-4">
                {loadingAtt ? (
                  <div className="bg-white rounded-[2rem] p-6 animate-pulse h-64" />
                ) : (
                  <AttendanceStats data={att} />
                )}

                {/* Class Absences */}
                {att?.classes?.some(c => c.absent > 0 || c.pending > 0) && (
                  <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100">
                    <h4 className="text-sm font-black text-slate-900 mb-4">
                      Class Absences
                    </h4>

                    <div className="flex flex-wrap gap-2">
                      {att.classes
                        .filter(c => c.absent > 0 || c.pending > 0)
                        .map((c, i) => (
                          <button
                            key={i}
                            onClick={() => openAbsentModal(c.grade || 'Unknown')}
                            className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all hover:opacity-80 ${
                              c.color === 'red'
                                ? 'bg-rose-100 text-rose-700'
                                : c.color === 'yellow'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {c.grade} · {c.absent > 0 ? `${c.absent} ပျက်` : `${c.pending} ဆိုင်း`}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Trend Chart */}
              <div className="lg:col-span-2 bg-slate-950 rounded-[2rem] p-6 border-b-[8px] border-[#fbbf24] shadow-xl text-white flex flex-col min-h-[400px]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[10px] uppercase tracking-widest text-[#fbbf24] font-black">
                    Attendance Trend (Last 30 Days)
                  </h3>

                  <span className="text-[9px] bg-white/10 px-3 py-1 rounded-full text-slate-300">
                    Daily Breakdown
                  </span>
                </div>

                {loadingAtt ? (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-white/50">
                    Loading chart...
                  </div>
                ) : (
                  <TrendChart trend={trend} />
                )}

                <div className="flex justify-between mt-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  <span>30 Days Ago</span>
                  <span>Today</span>
                </div>
              </div>
            </div>

            {/* Attendance Calendar */}
            <div>
              <h2 className="text-base md:text-xl uppercase tracking-tight text-slate-950 border-l-8 border-slate-950 pl-4 mb-4">
                📋 Attendance Calendar
              </h2>
              <AttendanceCalendar
                trendData={trend}
                onDayClick={handleDayClick}
              />
            </div>

            {/* Events Calendar */}
            <div>
              <h2 className="text-base md:text-xl uppercase tracking-tight text-slate-950 border-l-8 border-slate-950 pl-4 mb-4">
                🎉 Events Calendar
              </h2>
              <EventCalendar />
            </div>

          </div>
        )}

        {/* ===================== TOOLS PAGE ===================== */}
        {mainTab === 'tools' && (
          <div className="space-y-12 pt-2">
            {toolGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-6">
                <h2 className="text-base md:text-xl uppercase border-l-8 border-slate-950 pl-4 tracking-tight text-slate-950">
                  {group.group}
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {group.items.map((tool, i) => {
                    const locked = tool.perm ? !hasPerm(user, tool.perm) : false;

                    return (
                      <button
                        key={i}
                        onClick={() => !locked && router.push(tool.path)}
                        className={`relative group p-6 md:p-8 rounded-[2rem] border-b-[8px] transition-all duration-300 flex flex-col items-center text-center gap-4 shadow-lg ${
                          locked
                            ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                            : 'bg-white border-slate-100 hover:border-[#fbbf24] hover:-translate-y-1 active:scale-95'
                        }`}
                      >
                        <span className={`text-4xl md:text-5xl transition-transform duration-300 ${!locked && 'group-hover:scale-110'}`}>
                          {tool.icon}
                        </span>

                        <div>
                          <h3 className={`text-[11px] md:text-sm font-black uppercase italic tracking-tight leading-tight ${locked ? 'text-slate-400' : 'text-slate-950'}`}>
                            {tool.name}
                          </h3>
                        </div>

                        {locked && (
                          <div className="absolute top-4 right-4 text-slate-400 text-sm opacity-50">
                            🔒
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      <style jsx global>{`
        body {
          background-color: #F0F9FF;
          font-weight: 900 !important;
        }

        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}