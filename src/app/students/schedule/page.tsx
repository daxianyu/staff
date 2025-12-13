'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getStudentSchedule, type StudentScheduleResponse, getStudentName } from '@/services/auth';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';

type ViewMode = 'lessons' | 'exams';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const START_HOUR = 9;
const END_HOUR = 22;
const SLOT_MINUTES = 30;
const SLOTS_PER_DAY = ((END_HOUR - START_HOUR) * 60) / SLOT_MINUTES;

function getTimeSlots() {
  const slots: string[] = [];
  for (let i = 0; i < SLOTS_PER_DAY; i++) {
    const hour = START_HOUR + Math.floor((i * SLOT_MINUTES) / 60);
    const min = (i * SLOT_MINUTES) % 60;
    slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
  }
  return slots;
}

function getWeekDatesByMonday(monday: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function getCurrentMondayAndWeekNum() {
  const now = new Date();
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  const day = monday.getDay(); // 0=周日,1=周一
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  const base = new Date(1970, 0, 1);
  const days = Math.floor((monday.getTime() - base.getTime()) / (1000 * 60 * 60 * 24));
  const weekNum = Math.floor(days / 7);
  return { monday, weekNum };
}

function formatTime(timestamp: number) {
  const date = new Date(timestamp * 1000);
  return `${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
}

function getLessonCellInfo(lesson: {
  start_time: number;
  end_time: number;
}) {
  const start = new Date(lesson.start_time * 1000);
  const end = new Date(lesson.end_time * 1000);
  const weekday = (start.getDay() + 6) % 7; // 0=周一

  const startHour = start.getHours();
  const startMinute = start.getMinutes();
  const endHour = end.getHours();
  const endMinute = end.getMinutes();

  const startSlot = Math.floor(((startHour - START_HOUR) * 60 + startMinute) / SLOT_MINUTES);
  const endSlot = Math.ceil(((endHour - START_HOUR) * 60 + endMinute) / SLOT_MINUTES);

  return { weekday, startSlot, rowSpan: Math.max(1, endSlot - startSlot) };
}

export default function StudentSchedulePage() {
  const searchParams = useSearchParams();
  const studentIdParam = searchParams.get('studentId');
  const initialStudentId = useMemo(() => (studentIdParam ? parseInt(studentIdParam, 10) : 0), [studentIdParam]);
  const { hasPermission } = useAuth();
  const canEditClass = hasPermission(PERMISSIONS.EDIT_CLASSES);

  const [viewMode, setViewMode] = useState<ViewMode>('lessons');
  const [{ monday, weekNum }, setWeekInfo] = useState(() => getCurrentMondayAndWeekNum());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<StudentScheduleResponse['data']>({ student_exam: [], special_day: [], lessons: [] });
  const [studentName, setStudentName] = useState<string>('');
  const [selectedLesson, setSelectedLesson] = useState<(typeof data.lessons)[number] | null>(null);

  const slots = getTimeSlots();
  const weekDates = getWeekDatesByMonday(monday);

  const handleWeekChange = (delta: number | 'current') => {
    setWeekInfo(prev => {
      if (delta === 'current') {
        const cur = getCurrentMondayAndWeekNum();
        return cur;
      }
      const newMonday = new Date(prev.monday);
      newMonday.setDate(newMonday.getDate() + delta * 7);
      const base = new Date(1970, 0, 1);
      const days = Math.floor((newMonday.getTime() - base.getTime()) / (1000 * 60 * 60 * 24));
      const newWeekNum = Math.floor(days / 7);
      return { monday: newMonday, weekNum: newWeekNum };
    });
  };

  useEffect(() => {
    if (!initialStudentId) return;
    // 获取学生姓名（与课表并行/独立）
    getStudentName(initialStudentId)
      .then(res => {
        if (res.status === 0) setStudentName(res.data || '');
      })
      .catch(() => { });

    setLoading(true);
    setError('');
    getStudentSchedule(initialStudentId, weekNum)
      .then(resp => {
        if (resp.status === 0) {
          const processed = {
            ...resp.data,
            lessons: (resp.data.lessons || []).map(l => ({
              ...l,
              // 统一 students 为逗号分隔字符串
              students: Array.isArray((l as any).students) ? (l as any).students.join(',') : l.students,
            })),
          };
          setData(processed);
        } else {
          setError(resp.message || 'Failed to fetch');
        }
      })
      .catch(e => setError((e as Error)?.message || 'Network error'))
      .finally(() => setLoading(false));
  }, [initialStudentId, weekNum]);

  const cellMap: (typeof data.lessons[number] | null | undefined)[][] = Array.from({ length: slots.length }, () =>
    Array(7).fill(undefined)
  );
  const cellSpan: number[][] = Array.from({ length: slots.length }, () => Array(7).fill(1));

  (data.lessons || []).forEach(lesson => {
    const { weekday, startSlot, rowSpan } = getLessonCellInfo(lesson);
    if (startSlot >= 0 && startSlot < slots.length) {
      cellMap[startSlot][weekday] = lesson;
      cellSpan[startSlot][weekday] = rowSpan;
      for (let i = 1; i < rowSpan && startSlot + i < slots.length; i++) {
        cellMap[startSlot + i][weekday] = null;
      }
    }
  });

  const getExamForDay = (dayIndex: number) => (data.student_exam || []).find((exam: any) => exam.day === dayIndex);

  // 复刻：学生名字列表（折叠显示）
  function StudentsList({ students }: { students: string }) {
    const [showAll, setShowAll] = useState(false);
    if (!students || students.length === 0) return null;
    const names = students.split(',');
    const display = names.slice(0, 3).join(', ');
    const remain = names.length - 3;
    return (
      <div className="text-xs text-gray-600">
        Students: {display}
        {remain > 0 && (
          <>
            <button onClick={() => setShowAll(true)} className="ml-1 text-blue-500 hover:text-blue-600">and {names.length} total</button>
            {showAll && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-auto">
                  <h3 className="text-lg font-semibold mb-4">Students</h3>
                  <div className="max-h-60 overflow-y-auto">
                    {names.map((n, idx) => (<div key={idx} className="py-1">{n}</div>))}
                  </div>
                  <button onClick={() => setShowAll(false)} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 w-full">Close</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // 复刻：课程详情弹窗
  function LessonDetailModal({ lesson, onClose }: { lesson: (typeof data.lessons)[number]; onClose: () => void }) {
    if (!lesson) return null as any;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-auto">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Lesson: {lesson.subject_name}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-3">
            <div className="text-sm"><span className="font-semibold">Time: </span>{formatTime(lesson.start_time)} - {formatTime(lesson.end_time)}</div>
            <div className="text-sm"><span className="font-semibold">Teacher: </span>{lesson.teacher}</div>
            <div className="text-sm"><span className="font-semibold">Room: </span>{lesson.room_name}</div>
            {('class_name' in lesson) && (
              <div className="text-sm"><span className="font-semibold">Class: </span>{(lesson as any).class_name}</div>
            )}
            <div className="text-sm">
              <span className="font-semibold">Students: </span>
              <div className="mt-1 max-h-40 overflow-y-auto">
                {(lesson.students || '').split(',').map((s, i) => (
                  <div key={i} className="py-1 px-2 bg-gray-50 rounded mb-1">{s}</div>
                ))}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="mt-6 w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm sm:text-base">Close</button>
        </div>
      </div>
    );
  }

  // 复刻：特殊日期提示
  function SpecialDayNotices({ specialDays }: { specialDays: any[] }) {
    if (!specialDays || specialDays.length === 0) return null as any;
    return (
      <div className="mb-4 space-y-2">
        {specialDays.map((day: any, idx: number) => (
          <div key={idx} className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
            <div className="flex items-center text-orange-800">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{day.show_day} ({day.week})</span>
            </div>
            <div className="mt-1 text-orange-700 ml-7">{day.desc}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{studentName ? `${studentName}'s` : ''} Schedule</h1>
          {!initialStudentId && (
            <p className="mt-2 text-sm text-red-600">Missing studentId parameter</p>
          )}
        </div>

        <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleWeekChange(-1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Prev Week
            </button>
            <button
              onClick={() => handleWeekChange('current')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              This Week
            </button>
            <button
              onClick={() => handleWeekChange(1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Next Week
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('lessons')}
              className={`px-4 py-2 rounded-md transition-colors ${viewMode === 'lessons' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Lessons
            </button>
            <button
              onClick={() => setViewMode('exams')}
              className={`px-4 py-2 rounded-md transition-colors ${viewMode === 'exams' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Exams
            </button>
          </div>
        </div>

        <div className="mb-2 text-sm text-gray-600">
          {`${weekDates[0].getFullYear()}-${String(weekDates[0].getMonth() + 1).padStart(2, '0')}-${String(weekDates[0].getDate()).padStart(2, '0')}`}
          {' - '}
          {`${weekDates[6].getFullYear()}-${String(weekDates[6].getMonth() + 1).padStart(2, '0')}-${String(weekDates[6].getDate()).padStart(2, '0')}`}
        </div>

        <SpecialDayNotices specialDays={data.special_day as any} />

        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <div className="overflow-x-auto w-full pb-4">
            <table className="w-full border-collapse min-w-[800px]" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '80px', minWidth: '80px' }} />
                {Array(7)
                  .fill(null)
                  .map((_, i) => (
                    <col key={i} style={{ width: 'calc((100% - 80px) / 7)', minWidth: '120px' }} />
                  ))}
              </colgroup>
              <thead>
                <tr>
                  <th className="px-2 py-1 bg-gray-50 font-normal">Time</th>
                  {weekDates.map((d, i) => {
                    const exam = getExamForDay(i);
                    return (
                      <th key={i} className={`px-2 py-1 bg-gray-50 font-normal ${viewMode === 'exams' && exam ? 'bg-yellow-100' : ''}`}>
                        {WEEKDAYS[i]}<br />
                        {d.getMonth() + 1}/{d.getDate()}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {slots.map((slot, i) => {
                  const hourBlock = Math.floor(i / 2);
                  const isEvenHourBlock = hourBlock % 2 === 0;
                  return (
                    <tr key={slot} className={isEvenHourBlock ? 'bg-white' : 'bg-gray-200'}>
                      <td className="px-2 h-4 text-xs text-center">{slot}</td>
                      {Array(7)
                        .fill(null)
                        .map((_, j) => {
                          if (viewMode === 'lessons') {
                            const lesson = cellMap[i][j];
                            if (lesson === null) return null;
                            if (lesson) {
                              return (
                                <td
                                  key={j}
                                  className="px-2 py-5 bg-blue-100 align-top hover:bg-blue-200 transition-colors"
                                  rowSpan={cellSpan[i][j]}
                                >
                                  <div className="font-bold text-sm mb-0.5">
                                    {canEditClass && (lesson as any).class_id ? (
                                      <Link
                                        href={`/class/edit?id=${(lesson as any).class_id}`}
                                        className="text-blue-700 hover:underline"
                                        target="_blank"
                                      >
                                        {lesson.subject_name}
                                      </Link>
                                    ) : (
                                      lesson.subject_name
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 mb-0.5">
                                    {formatTime(lesson.start_time)} - {formatTime(lesson.end_time)}
                                  </div>
                                  <div className="text-xs text-gray-600">Teacher: {lesson.teacher}</div>
                                  <div className="text-xs text-gray-600">Room: {lesson.room_name}</div>
                                  <StudentsList students={lesson.students as unknown as string} />
                                </td>
                              );
                            }
                            return <td key={j} className={`px-2 py-5 ${isEvenHourBlock ? 'bg-white' : 'bg-gray-200'}`} />;
                          } else {
                            const exams = (data.student_exam || []).filter((exam: any) => exam.day === j);
                            if (exams.length > 0 && i === 0) {
                              return (
                                <td
                                  key={j}
                                  rowSpan={slots.length}
                                  className="px-2 py-5 bg-yellow-100 text-left align-top font-bold"
                                  style={{ verticalAlign: 'top', textAlign: 'left' }}
                                >
                                  <ul className="list-disc list-inside">
                                    {exams.map((exam: any) => (
                                      <li key={exam.exam_id}>{exam.exam_name}</li>
                                    ))}
                                  </ul>
                                </td>
                              );
                            }
                            if (exams.length > 0) return null;
                            return <td key={j} className={`px-2 py-5 ${isEvenHourBlock ? 'bg-white' : 'bg-gray-200'}`} />;
                          }
                        })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {selectedLesson && (
        <LessonDetailModal lesson={selectedLesson} onClose={() => setSelectedLesson(null)} />
      )}
    </div>
  );
}


