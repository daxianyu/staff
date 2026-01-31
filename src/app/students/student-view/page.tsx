'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  getStudentAllLessonsView,
  type StudentViewResponseData,
  getStudentName,
  getBiweeklyFeedbackEntries,
  type BiweeklyFeedbackEntry,
} from '@/services/auth';

function formatDate(ts?: number | string | null) {
  if (!ts || ts === -1) return '-';
  const n = typeof ts === 'string' ? parseInt(ts, 10) : ts;
  const d = new Date((n as number) * 1000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatTime(ts: number) {
  const d = new Date(ts * 1000);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatDateTimeMs(ms?: number) {
  if (!ms) return '-';
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

export default function StudentViewPage() {
  const search = useSearchParams();
  const studentId = search.get('studentId') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StudentViewResponseData | null>(null);
  const [studentName, setStudentName] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'monthly' | 'progress' | 'comments' | 'biweekly'>('info');
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [monthlySubTab, setMonthlySubTab] = useState<'lessons' | 'authorized' | 'unauthorized'>('lessons');

  useEffect(() => {
    if (!studentId) return;
    (async () => {
      try {
        console.log('[StudentView] start fetching', { studentId });
        setLoading(true);
        setError(null);
        const [viewResp, nameResp] = await Promise.all([
          getStudentAllLessonsView(studentId),
          getStudentName(studentId),
        ]);
        console.log('[StudentView] viewResp', viewResp);
        console.log('[StudentView] nameResp', nameResp);
        if (viewResp.status === 0) {
          setData(viewResp.data);
        } else {
          setError(viewResp.message || 'Failed to fetch');
        }
        if (nameResp.status === 0) setStudentName(nameResp.data || '');
      } catch (e) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId]);

  // 提取所有课程，便于可视化
  const allLessons = useMemo(() => {
    const list: Array<{
      subjectId: string;
      subjectName: string;
      start_time: number;
      end_time: number;
      className: string;
      teacherId?: string;
      studentNum?: number;
    }> = [];
    if (!data) return list;
    Object.values(data.lesson_data || {}).forEach(classEntry => {
      const className = classEntry.class_name;
      const studentNum = (classEntry as any).student_num as number | undefined;
      Object.entries(classEntry.subjects || {}).forEach(([subjectId, subject]) => {
        const subjectName = data.class_topics?.[String(subject.topic_id)] || subject.topic_name;
        const teacherId = (subject as any).teacher_id as string | undefined;
        (subject.lessons || []).forEach(lsn => {
          list.push({
            subjectId,
            subjectName,
            start_time: lsn.start_time,
            end_time: lsn.end_time,
            className,
            teacherId,
            studentNum,
          });
        });
      });
    });
    return list.sort((a, b) => a.start_time - b.start_time);
  }, [data]);

  // Progress by subject (0-100%) based on current time
  const nowSec = Math.floor(Date.now() / 1000);
  const subjectProgress = useMemo(() => {
    const m: Record<string, { subjectName: string; totalSec: number; doneSec: number; lessonCount: number }>= {};
    allLessons.forEach(l => {
      const key = l.subjectId;
      if (!m[key]) m[key] = { subjectName: l.subjectName, totalSec: 0, doneSec: 0, lessonCount: 0 };
      const dur = Math.max(0, l.end_time - l.start_time);
      const done = Math.max(0, Math.min(dur, nowSec - l.start_time));
      m[key].totalSec += dur;
      m[key].doneSec += done;
      m[key].lessonCount += 1;
    });
    return Object.entries(m).map(([subjectId, v]) => {
      const pct = v.totalSec > 0 ? Math.round((v.doneSec / v.totalSec) * 100) : 0;
      return { subjectId, subjectName: v.subjectName, pct, totalHours: +(v.totalSec/3600).toFixed(1), doneHours: +(v.doneSec/3600).toFixed(1), lessonCount: v.lessonCount };
    }).sort((a,b)=> a.subjectName.localeCompare(b.subjectName));
  }, [allLessons, nowSec]);

  // lessons grouped by subject for detail expansion
  const subjectLessonsMap = useMemo(() => {
    const m: Record<string, typeof allLessons> = {} as any;
    allLessons.forEach(l => {
      if (!m[l.subjectId]) m[l.subjectId] = [] as any;
      (m[l.subjectId] as any).push(l);
    });
    Object.values(m).forEach((arr:any) => arr.sort((a:any,b:any)=>a.start_time-b.start_time));
    return m;
  }, [allLessons]);
  const [expandedSubjectsProgress, setExpandedSubjectsProgress] = useState<Set<string>>(new Set());

  // 颜色分配（避免动态Tailwind类问题，使用内联色值）
  const palette = ['#60a5fa','#34d399','#fbbf24','#f472b6','#a78bfa','#f87171','#22d3ee','#f59e0b','#10b981','#c084fc'];
  const colorForSubject = (subjectId: string) => {
    const idx = Math.abs(subjectId.split('').reduce((s, c) => s + c.charCodeAt(0), 0)) % palette.length;
    return palette[idx];
  };

  // ========== 月份衍生数据 ==========
  const monthKey = (ts: number) => {
    const d = new Date(ts * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const monthList = useMemo(() => {
    const set = new Set<string>();
    allLessons.forEach(i => set.add(monthKey(i.start_time)));
    return Array.from(set).sort();
  }, [allLessons]);

  const [selectedMonth, setSelectedMonth] = useState<string>('');
  useEffect(() => {
    if (monthList.length > 0 && !selectedMonth) {
      setSelectedMonth(monthList[monthList.length - 1]);
    }
  }, [monthList, selectedMonth]);

  // 月份边界（本地时区）
  const monthRange = useMemo(() => {
    if (!selectedMonth) return { startSec: 0, endSec: 0 };
    const [y, m] = selectedMonth.split('-').map(Number);
    const start = new Date(y, (m || 1) - 1, 1, 0, 0, 0, 0);
    const end = new Date(y, (m || 1), 1, 0, 0, 0, 0);
    return { startSec: Math.floor(start.getTime() / 1000), endSec: Math.floor(end.getTime() / 1000) };
  }, [selectedMonth]);

  // 取与当月相交的课程，并计算相交时长（直接遍历 lesson_data -> subjects -> lessons，避免遗漏）
  const lessonsOfSelectedMonth = useMemo(() => {
    if (!selectedMonth || !data) return [] as Array<{
      subjectId: string;
      subjectName: string;
      start_time: number;
      end_time: number;
      className: string;
      teacher: string;
      studentNum?: number;
      overlapSec: number;
    }>;
    const out: Array<{ subjectId: string; subjectName: string; start_time: number; end_time: number; className: string; teacher: string; studentNum?: number; overlapSec: number; }> = [];
    Object.values(data.lesson_data || {}).forEach(classEntry => {
      const className = classEntry.class_name;
      const studentNum = (classEntry as any).student_num as number | undefined;
      Object.entries(classEntry.subjects || {}).forEach(([subjectId, subject]) => {
        const subjectName = data.class_topics?.[String(subject.topic_id)] || (subject as any).topic_name || '';
        const teacher = (subject as any).teacher_id || '';
        (subject.lessons || []).forEach((lsn: any) => {
          const start_time = lsn.start_time;
          const end_time = lsn.end_time;
          const overlapStart = Math.max(start_time, monthRange.startSec);
          const overlapEnd = Math.min(end_time, monthRange.endSec);
          const overlapSec = Math.max(0, overlapEnd - overlapStart);
          if (overlapSec > 0) {
            out.push({ subjectId: String(subjectId), subjectName, start_time, end_time, className, teacher, studentNum, overlapSec });
          }
        });
      });
    });
    // 按时间排序
    out.sort((a, b) => a.start_time - b.start_time);
    return out;
  }, [data, selectedMonth, monthRange.startSec, monthRange.endSec]);


  // Group by class name for monthly view (requested)
  const lessonsByClassInMonth = useMemo(() => {
    const map: Record<string, Array<(typeof lessonsOfSelectedMonth)[number]>> = {};
    lessonsOfSelectedMonth.forEach(l => {
      const key = l.className || 'Unknown Class';
      if (!map[key]) map[key] = [];
      map[key].push(l);
    });
    Object.values(map).forEach(arr => arr.sort((a, b) => a.start_time - b.start_time));
    return map;
  }, [lessonsOfSelectedMonth]);

  const classStatsInMonth = useMemo(() => {
    const arr = Object.entries(lessonsByClassInMonth).map(([className, list]) => ({ className, count: list.length }));
    const maxCount = arr.reduce((m, i) => Math.max(m, i.count), 0) || 1;
    return { arr, maxCount };
  }, [lessonsByClassInMonth]);

  // Monthly: total hours
  const monthTotalHours = useMemo(() => {
    const hours = lessonsOfSelectedMonth.reduce((sum, i) => sum + i.overlapSec / 3600, 0);
    return Math.round(hours * 10) / 10;
  }, [lessonsOfSelectedMonth]);


  // Monthly: unauthorized absence (best-effort from absence_info)
  const monthAbsence = useMemo(() => {
    let lessons = 0;
    let hours = 0;
    const ai: any = data?.absence_info;
    if (!selectedMonth || !ai) return { lessons, hours };
    // 支持多种结构，且计算与当月的相交时长
    const add = (start: number, end: number) => {
      const overlapStart = Math.max(start, monthRange.startSec);
      const overlapEnd = Math.min(end, monthRange.endSec);
      const overlapSec = Math.max(0, overlapEnd - overlapStart);
      if (overlapSec <= 0) return;
      lessons += 1;
      hours += overlapSec / 3600;
    };
    if (Array.isArray(ai)) {
      ai.forEach((row: any) => {
        const una = row?.unauthorized === 1 || row?.type === 'unauthorized' || row?.reason === 'unauthorized';
        if (una && (row.start_time && row.end_time)) add(row.start_time, row.end_time);
      });
    } else if (typeof ai === 'object') {
      Object.values(ai).forEach((row: any) => {
        const una = row?.unauthorized === 1 || row?.type === 'unauthorized' || row?.reason === 'unauthorized';
        if (una && (row.start_time && row.end_time)) add(row.start_time, row.end_time);
      });
    }
    return { lessons, hours: Math.round(hours * 10) / 10 };
  }, [data?.absence_info, selectedMonth, monthRange.startSec, monthRange.endSec]);

  // Absence details (monthly) — normalize authorized vs unauthorized lists
  const monthlyAuthorizedAbsences = useMemo(() => {
    const list: Array<{ start_time: number; end_time: number; overlapSec: number; reason?: string; note?: string }>
      = [];
    const ai: any = data?.absence_info;
    if (!selectedMonth || !ai) return list;
    const pushIfOverlap = (row: any) => {
      const start = row.start_time;
      const end = row.end_time;
      if (!start || !end) return;
      const overlapStart = Math.max(start, monthRange.startSec);
      const overlapEnd = Math.min(end, monthRange.endSec);
      const overlapSec = Math.max(0, overlapEnd - overlapStart);
      if (overlapSec > 0) list.push({ start_time: start, end_time: end, overlapSec, reason: row.reason, note: row.note });
    };
    if (Array.isArray(ai?.authorized)) {
      (ai.authorized as any[]).forEach(pushIfOverlap);
    } else if (Array.isArray(ai)) {
      (ai as any[]).forEach(row => {
        const una = row?.unauthorized === 1 || row?.type === 'unauthorized' || row?.reason === 'unauthorized';
        if (!una) pushIfOverlap(row);
      });
    } else if (typeof ai === 'object') {
      Object.values(ai).forEach((row: any) => {
        const una = row?.unauthorized === 1 || row?.type === 'unauthorized' || row?.reason === 'unauthorized';
        if (!una) pushIfOverlap(row);
      });
    }
    return list.sort((a, b) => a.start_time - b.start_time);
  }, [data?.absence_info, selectedMonth, monthRange.startSec, monthRange.endSec]);

  const monthlyUnauthorizedAbsences = useMemo(() => {
    const list: Array<{ start_time: number; end_time: number; overlapSec: number; reason?: string; note?: string }>
      = [];
    const ai: any = data?.absence_info;
    if (!selectedMonth || !ai) return list;
    const pushIfOverlap = (row: any) => {
      const start = row.start_time;
      const end = row.end_time;
      if (!start || !end) return;
      const overlapStart = Math.max(start, monthRange.startSec);
      const overlapEnd = Math.min(end, monthRange.endSec);
      const overlapSec = Math.max(0, overlapEnd - overlapStart);
      if (overlapSec > 0) list.push({ start_time: start, end_time: end, overlapSec, reason: row.reason, note: row.note });
    };
    if (Array.isArray(ai?.unauthorized)) {
      (ai.unauthorized as any[]).forEach(pushIfOverlap);
    } else if (Array.isArray(ai)) {
      (ai as any[]).forEach(row => {
        const una = row?.unauthorized === 1 || row?.type === 'unauthorized' || row?.reason === 'unauthorized';
        if (una) pushIfOverlap(row);
      });
    } else if (typeof ai === 'object') {
      Object.values(ai).forEach((row: any) => {
        const una = row?.unauthorized === 1 || row?.type === 'unauthorized' || row?.reason === 'unauthorized';
        if (una) pushIfOverlap(row);
      });
    }
    return list.sort((a, b) => a.start_time - b.start_time);
  }, [data?.absence_info, selectedMonth, monthRange.startSec, monthRange.endSec]);

  // ===== Teacher Comments grouped by subject_id/topic_id =====
  const commentsBySubject = useMemo(() => {
    const fb: any[] = (data as any)?.feedback || [];
    const topics: Record<string, string> = (data as any)?.class_topics || {};
    const map: Record<string, { name: string; items: any[] }> = {};
    fb.forEach((f: any) => {
      const id = String(f?.subject_id ?? f?.topic_id ?? f?.topic ?? f?.topic_name ?? 'unknown');
      const name = f?.subject_name ?? f?.topic_name ?? topics[String(f?.topic_id)] ?? `Subject ${id}`;
      if (!map[id]) map[id] = { name, items: [] };
      map[id].items.push(f);
    });
    return Object.entries(map)
      .map(([id, g]) => ({ id, name: g.name, items: g.items }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);
  const [expandedCommentSubjects, setExpandedCommentSubjects] = useState<Set<string>>(new Set());

  const biweeklyFeedback = useMemo<BiweeklyFeedbackEntry[]>(
    () => getBiweeklyFeedbackEntries(data?.feedback),
    [data?.feedback]
  );



  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h1 className="text-xl font-semibold text-gray-900">{studentName ? `${studentName}'s ` : ''}Student View</h1>
        </div>
        {/* Tabs */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setActiveTab('info')} className={`px-3 py-1.5 rounded ${activeTab==='info'?'bg-blue-600 text-white':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Personal Info</button>
          <button onClick={() => setActiveTab('monthly')} className={`px-3 py-1.5 rounded ${activeTab==='monthly'?'bg-blue-600 text-white':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Monthly Distribution</button>
          <button onClick={() => setActiveTab('progress')} className={`px-3 py-1.5 rounded ${activeTab==='progress'?'bg-blue-600 text-white':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Student Progress</button>
          <button onClick={() => setActiveTab('biweekly')} className={`px-3 py-1.5 rounded ${activeTab==='biweekly'?'bg-blue-600 text-white':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Biweekly Feedback</button>
          <button onClick={() => setActiveTab('comments')} className={`px-3 py-1.5 rounded ${activeTab==='comments'?'bg-blue-600 text-white':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Teacher Comments</button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-64 text-gray-600">Loading...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-4">{error}</div>
      ) : !data ? null : (
        <div className="space-y-6">
          {/* Tab: Monthly Distribution */}
          {activeTab === 'monthly' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Monthly Distribution</h2>
                {/* 月份选择 */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Month:</span>
                  <div className="flex flex-wrap gap-2">
                    {monthList.map(m => (
                      <button key={m} onClick={() => setSelectedMonth(m)} className={`px-2 py-1 rounded text-sm ${selectedMonth===m?'bg-blue-600 text-white':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{m}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {/* Sub-tabs */}
                <div className="flex items-center gap-2">
                  <button onClick={() => setMonthlySubTab('lessons')} className={`px-3 py-1.5 rounded ${monthlySubTab==='lessons'?'bg-blue-600 text-white':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Lessons</button>
                  <button onClick={() => setMonthlySubTab('authorized')} className={`px-3 py-1.5 rounded ${monthlySubTab==='authorized'?'bg-blue-600 text-white':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Absence (Authorized)</button>
                  <button onClick={() => setMonthlySubTab('unauthorized')} className={`px-3 py-1.5 rounded ${monthlySubTab==='unauthorized'?'bg-blue-600 text-white':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Absence (Unauthorized)</button>
                </div>

                {/* KPIs（仅 Lessons 子页显示） */}
                {monthlySubTab === 'lessons' && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Total Lessons</div>
                      <div className="text-2xl font-semibold text-gray-900">{lessonsOfSelectedMonth.length}</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Total hours</div>
                      <div className="text-2xl font-semibold text-gray-900">{monthTotalHours}</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Unauthorized absence lessons</div>
                      <div className="text-2xl font-semibold text-gray-900">{monthAbsence.lessons}</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Unauthorized absence hours</div>
                      <div className="text-2xl font-semibold text-gray-900">{monthAbsence.hours}</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Campus lessons</div>
                      <div className="text-sm text-gray-500">N/A</div>
                    </div>
                  </div>
                )}

                {/* Lessons: Class relative (group by class_name) */}
                {monthlySubTab === 'lessons' && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-3">Class relative</div>
                  <div className="space-y-3">
                    {classStatsInMonth.arr.length === 0 && (
                      <div className="text-gray-500 text-sm">No data</div>
                    )}
                    {classStatsInMonth.arr.map(stat => {
                      const pct = Math.round((stat.count / classStatsInMonth.maxCount) * 100);
                      const bg = colorForSubject(stat.className);
                      const isOpen = expandedSubjects.has(stat.className);
                      const toggle = () => {
                        setExpandedSubjects(prev => {
                          const next = new Set(prev);
                          if (next.has(stat.className)) next.delete(stat.className); else next.add(stat.className);
                          return next;
                        });
                      };
                      const lessons = lessonsByClassInMonth[stat.className] || [];
                      return (
                        <div key={stat.className} className="space-y-2">
                          <button onClick={toggle} className="w-full text-left">
                            <div className="flex items-center justify-between text-xs text-gray-600">
                              <div className="flex items-center gap-2 truncate mr-2">
                                <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                                <span className="truncate">{stat.className}</span>
                              </div>
                              <div className="whitespace-nowrap">{stat.count} lessons</div>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded mt-1">
                              <div className="h-2 rounded" style={{ width: `${pct}%`, backgroundColor: bg }} />
                            </div>
                          </button>

                          {isOpen && (
                            <div className="border rounded-md overflow-hidden">
                              {/* class meta info */}
                              <div className="px-3 py-2 text-xs text-gray-600 border-b bg-gray-50 flex flex-wrap gap-4">
                                <span><span className="text-gray-500">Class:</span> {stat.className}</span>
                                <span><span className="text-gray-500">Students:</span> {(lessons[0]?.studentNum ?? '-')}</span>
                                <span><span className="text-gray-500">Teacher:</span> {(lessons[0]?.teacher || '-')}</span>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="min-w-full">
                              <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase">Date</th>
                                      <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase">Time</th>
                                      <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase">Duration (h)</th>
                                      <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase">Subject</th>
                                      <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase">Teacher</th>
                                  <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase">Students</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y">
                                    {lessons.map((l, idx) => {
                                      const dur = Math.max(0, l.overlapSec) / 3600;
                                      return (
                                        <tr key={idx} className="bg-white">
                                          <td className="px-3 py-2 text-sm text-gray-900">{formatDate(l.start_time)}</td>
                                          <td className="px-3 py-2 text-sm text-gray-900">{formatTime(l.start_time)} - {formatTime(l.end_time)}</td>
                                          <td className="px-3 py-2 text-sm text-gray-900">{(Math.round(dur * 10) / 10).toFixed(1)}</td>
                                          <td className="px-3 py-2 text-sm text-gray-900">{l.subjectName}</td>
                                          <td className="px-3 py-2 text-sm text-gray-900">{l.teacher}</td>
                                      <td className="px-3 py-2 text-sm text-gray-900">{l.studentNum ?? '-'}</td>
                                        </tr>
                                      );
                                    })}
                                    {lessons.length === 0 && (
                                    <tr>
                                        <td className="px-3 py-3 text-center text-sm text-gray-500" colSpan={6}>No lessons</td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                )}
                
                {monthlySubTab === 'authorized' && (
                  <div className="space-y-4">
                    <div className="text-sm font-medium text-gray-700">Absence info (Authorized)</div>
                    {/* KPIs for authorized: count + hours */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">Absent lessons</div>
                        <div className="text-2xl font-semibold text-gray-900">{monthlyAuthorizedAbsences.length}</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">Absent hours</div>
                        <div className="text-2xl font-semibold text-gray-900">{(Math.round((monthlyAuthorizedAbsences.reduce((s, a) => s + a.overlapSec / 3600, 0)) * 10) / 10)}</div>
                      </div>
                    </div>
                    <div className="border rounded-md overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase">Time</th>
                            <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase">Duration (h)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {monthlyAuthorizedAbsences.map((a, idx) => (
                            <tr key={idx} className="bg-white">
                              <td className="px-3 py-2 text-sm text-gray-900">{formatDate(a.start_time)}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">{formatTime(a.start_time)} - {formatTime(a.end_time)}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">{(Math.round((a.overlapSec/3600) * 10) / 10).toFixed(1)}</td>
                            </tr>
                          ))}
                          {monthlyAuthorizedAbsences.length === 0 && (
                            <tr><td className="px-3 py-3 text-center text-sm text-gray-500" colSpan={3}>No authorized absence</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {monthlySubTab === 'unauthorized' && (
                  <div className="space-y-4">
                    <div className="text-sm font-medium text-gray-700">Absence info (Unauthorized)</div>
                    {/* KPIs for unauthorized: count + hours */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">Absent lessons</div>
                        <div className="text-2xl font-semibold text-gray-900">{monthlyUnauthorizedAbsences.length}</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">Absent hours</div>
                        <div className="text-2xl font-semibold text-gray-900">{(Math.round((monthlyUnauthorizedAbsences.reduce((s, a) => s + a.overlapSec / 3600, 0)) * 10) / 10)}</div>
                      </div>
                    </div>
                    <div className="border rounded-md overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase">Time</th>
                            <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase">Duration (h)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {monthlyUnauthorizedAbsences.map((a, idx) => (
                            <tr key={idx} className="bg-white">
                              <td className="px-3 py-2 text-sm text-gray-900">{formatDate(a.start_time)}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">{formatTime(a.start_time)} - {formatTime(a.end_time)}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">{(Math.round((a.overlapSec/3600) * 10) / 10).toFixed(1)}</td>
                            </tr>
                          ))}
                          {monthlyUnauthorizedAbsences.length === 0 && (
                            <tr><td className="px-3 py-3 text-center text-sm text-gray-500" colSpan={3}>No unauthorized absence</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'biweekly' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Biweekly Feedback</h2>
                <span className="text-xs text-gray-500">Last 30 days</span>
              </div>
              <div className="p-6 space-y-4">
                {biweeklyFeedback.length === 0 ? (
                  <div className="text-gray-500 text-sm">No feedback in the last month</div>
                ) : (
                  <div className="space-y-4">
                    {biweeklyFeedback.map(item => (
                      <div key={`${item.id}-${item.timestamp}`} className="p-4 border rounded-lg bg-white shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-medium text-gray-900">{item.teacher || 'Unknown Teacher'}</div>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">{item.topic_name || '-'}</div>
                        <div className="text-xs text-gray-500 mt-1">{`${item.time_range_start || '-'} ~ ${item.time_range_end || '-'}`}</div>
                        <div className="mt-3 text-sm text-gray-800 whitespace-pre-wrap">
                          {item.note ? item.note : <span className="text-gray-500">No content</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Student Progress （现有可视化） */}
          {activeTab === 'progress' && (
            <>
              {/* 可视化：概览 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Visual Overview</h2>
            </div>
            <div className="p-6 space-y-6">
              {/* 科目总时长（自身百分比 + 可展开） */}
              <div>
                <div className="text-sm font-medium text-gray-700 mb-3">Total Teaching Time by Subject</div>
                <div className="space-y-3">
                  {subjectProgress.length === 0 && (
                    <div className="text-gray-500 text-sm">No data</div>
                  )}
                  {subjectProgress.map(row => {
                    const bg = colorForSubject(row.subjectId);
                    const isOpen = expandedSubjectsProgress.has(row.subjectId);
                    const toggle = () => setExpandedSubjectsProgress(prev => {
                      const n = new Set(prev);
                      if (n.has(row.subjectId)) n.delete(row.subjectId); else n.add(row.subjectId);
                      return n;
                    });
                    return (
                      <div key={row.subjectId} className="space-y-2">
                        <button onClick={toggle} className="w-full text-left">
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <div className="flex items-center gap-2 truncate mr-2">
                              <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                              </svg>
                              <span className="truncate">{row.subjectName}</span>
                            </div>
                            <div className="whitespace-nowrap">{row.doneHours}/{row.totalHours}h · {row.lessonCount} lessons</div>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded mt-1">
                            <div className="h-2 rounded" style={{ width: `${row.pct}%`, backgroundColor: bg }} />
                          </div>
                        </button>
                        {isOpen && (
                          <div className="border rounded-md overflow-x-auto">
                            <table className="min-w-full">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase">Date</th>
                                  <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase">Time</th>
                                  <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase">Duration (h)</th>
                                  <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase">Class</th>
                                  <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase">Teacher</th>
                                  <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase">Students</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {(subjectLessonsMap[row.subjectId] || []).map((l, idx) => (
                                  <tr key={idx} className="bg-white">
                                    <td className="px-3 py-2 text-sm text-gray-900">{formatDate(l.start_time)}</td>
                                    <td className="px-3 py-2 text-sm text-gray-900">{formatTime(l.start_time)} - {formatTime(l.end_time)}</td>
                                    <td className="px-3 py-2 text-sm text-gray-900">{((l.end_time - l.start_time)/3600).toFixed(1)}</td>
                                    <td className="px-3 py-2 text-sm text-gray-900">{l.className}</td>
                                    <td className="px-3 py-2 text-sm text-gray-900">{l.teacherId ?? '-'}</td>
                                    <td className="px-3 py-2 text-sm text-gray-900">{l.studentNum ?? '-'}</td>
                                  </tr>
                                ))}
                                {(!subjectLessonsMap[row.subjectId] || subjectLessonsMap[row.subjectId].length === 0) && (
                                  <tr><td className="px-3 py-3 text-center text-sm text-gray-500" colSpan={6}>No lessons</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
            </>
          )}

          {/* Tab: Personal Info */}
          {activeTab === 'info' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Basic Info</h2>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">First Name</div>
                  <div className="text-gray-900">{data.student_data?.first_name || '-'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Last Name</div>
                  <div className="text-gray-900">{data.student_data?.last_name || '-'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Email</div>
                  <div className="text-gray-900">{data.student_data?.email || '-'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Enrolment Date</div>
                  <div className="text-gray-900">{formatDate(data.student_data?.enrolment_date || null)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Graduation Date</div>
                  <div className="text-gray-900">{formatDate(data.student_data?.graduation_date || null)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Active</div>
                  <div className="text-gray-900">{data.student_data?.active ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Teacher Comments (grouped by subject) */}
          {activeTab === 'comments' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Teacher Comments</h2>
              </div>
              <div className="p-6">
                {(commentsBySubject.length === 0) ? (
                  <div className="text-gray-500">No comments</div>
                ) : (
                  <div className="space-y-4">
                    {commentsBySubject.map(group => {
                      const isOpen = expandedCommentSubjects.has(group.id);
                      const toggle = () => setExpandedCommentSubjects(prev => {
                        const n = new Set(prev);
                        if (n.has(group.id)) n.delete(group.id); else n.add(group.id);
                        return n;
                      });
                      return (
                        <div key={group.id} className="border rounded-lg overflow-hidden">
                          <button onClick={toggle} className="w-full text-left px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                              </svg>
                              <span className="text-sm font-medium text-gray-900">{group.name}</span>
                            </div>
                            <span className="text-xs text-gray-500">{group.items.length} comments</span>
                          </button>
                          {isOpen && (
                            <div className="p-4 space-y-4">
                              {group.items.map((f: any, idx: number) => (
                                <div key={idx} className="p-4 border rounded">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="text-sm font-medium text-gray-900">{f.teacher || 'Unknown Teacher'}</div>
                                    <div className="text-xs text-gray-500">{(f.time_range_start && f.time_range_end) ? `${f.time_range_start} ~ ${f.time_range_end}` : ''}</div>
                                  </div>
                                  <div className="text-xs text-gray-600 mt-1">{f.topic_name || '-'}</div>
                                  {f.note ? (
                                    <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">{f.note}</div>
                                  ) : (
                                    <div className="mt-2 text-sm text-gray-500">No content</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Feedback & Absence 可按需扩展 */}
        </div>
      )}
    </div>
  );
}
