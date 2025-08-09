'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getStudentSchedule, type StudentScheduleResponse } from '@/services/auth';

type ViewMode = 'lessons' | 'exams';

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
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

  const [viewMode, setViewMode] = useState<ViewMode>('lessons');
  const [{ monday, weekNum }, setWeekInfo] = useState(() => getCurrentMondayAndWeekNum());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<StudentScheduleResponse['data']>({ student_exam: [], special_day: [], lessons: [] });

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
          setError(resp.message || '获取失败');
        }
      })
      .catch(e => setError((e as Error)?.message || '网络错误'))
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Student Schedule</h1>
          {!initialStudentId && (
            <p className="mt-2 text-sm text-red-600">缺少 studentId 参数</p>
          )}
        </div>

        <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleWeekChange(-1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              上一周
            </button>
            <button
              onClick={() => handleWeekChange('current')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              本周
            </button>
            <button
              onClick={() => handleWeekChange(1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              下一周
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('lessons')}
              className={`px-4 py-2 rounded-md transition-colors ${
                viewMode === 'lessons' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              课程
            </button>
            <button
              onClick={() => setViewMode('exams')}
              className={`px-4 py-2 rounded-md transition-colors ${
                viewMode === 'exams' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              考试
            </button>
          </div>
        </div>

        <div className="mb-2 text-sm text-gray-600">
          {weekDates[0].getFullYear()}年{weekDates[0].getMonth() + 1}月{weekDates[0].getDate()}日 - {weekDates[6].getFullYear()}年
          {weekDates[6].getMonth() + 1}月{weekDates[6].getDate()}日
        </div>

        {loading ? (
          <div>加载中...</div>
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
                  <th className="px-2 py-1 bg-gray-50 font-normal">时间</th>
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
                                  <div className="font-bold text-sm mb-0.5">{lesson.subject_name}</div>
                                  <div className="text-xs text-gray-500 mb-0.5">
                                    {formatTime(lesson.start_time)} - {formatTime(lesson.end_time)}
                                  </div>
                                  <div className="text-xs text-gray-600">教师：{lesson.teacher}</div>
                                  <div className="text-xs text-gray-600">教室：{lesson.room_name}</div>
                                  <div className="text-xs text-gray-600 mt-1">
                                    学生：{(lesson.students || '').split(',').slice(0, 3).join(', ')}
                                    {((lesson.students || '').split(',').length > 3) && ' 等'}
                                  </div>
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
    </div>
  );
}


