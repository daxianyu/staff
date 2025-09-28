'use client';

import { useEffect, useMemo, useState } from 'react';
import { getClassroomOverview, type ClassroomOverviewData, type ClassroomLesson } from '@/services/modules/classroom';
import { authService } from '@/services/authService';
import type { UserInfo } from '@/types/permission';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  BuildingOfficeIcon,
  ClockIcon,
  XMarkIcon,
  UserIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';

const LESSON_COLOR_CLASSES = [
  'bg-blue-500 border-blue-600',
  'bg-green-500 border-green-600',
];

export default function ClassroomViewPage() {
  const canView = true;

  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState<ClassroomOverviewData | null>(null);
  const [currentDay, setCurrentDay] = useState<number>(Math.floor(Date.now() / 86400000));
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [topics, setTopics] = useState<Record<string, string>>({});
  const [selectedLesson, setSelectedLesson] = useState<ClassroomLesson | null>(null);
  const [showLessonModal, setShowLessonModal] = useState(false);

  // 生成时间槽位 (9:00-22:00, 每半小时一格)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const timestamp = new Date(2000, 0, 1, hour, minute).getTime() / 1000;
        slots.push({
          time: timeString,
          hour,
          minute,
          timestamp,
        });
      }
    }
    return slots;
  };

  const timeSlots = useMemo(() => generateTimeSlots(), []);

  const rooms = useMemo(() => {
    if (!overviewData) return [] as Array<{
      roomId: number;
      roomName: string;
      campusId: string;
      campusName: string;
    }>;

    const items: Array<{
      roomId: number;
      roomName: string;
      campusId: string;
      campusName: string;
    }> = [];

    Object.entries(overviewData.room_campuses).forEach(([campusId, roomList]) => {
      roomList.forEach(([roomName, roomId]) => {
        items.push({
          roomId,
          roomName,
          campusId,
          campusName: overviewData.campus_info[campusId] ?? '',
        });
      });
    });

    return items.sort((a, b) => {
      if (a.campusId === b.campusId) {
        return a.roomName.localeCompare(b.roomName, 'zh-CN');
      }
      return a.campusName.localeCompare(b.campusName, 'zh-CN');
    });
  }, [overviewData]);

  const roomsByCampus = useMemo(() => {
    const map: Record<string, { campusId: string; campusName: string; rooms: Array<{ roomId: number; roomName: string }> }> = {};
    rooms.forEach(room => {
      if (!map[room.campusId]) {
        map[room.campusId] = {
          campusId: room.campusId,
          campusName: room.campusName,
          rooms: [],
        };
      }
      map[room.campusId].rooms.push({ roomId: room.roomId, roomName: room.roomName });
    });
    return Object.values(map).sort((a, b) => a.campusName.localeCompare(b.campusName, 'zh-CN'));
  }, [rooms]);

  // 加载用户Topics信息
  const loadUserTopics = async () => {
    try {
      const resp = await authService.getUserInfo();
      if (resp.code === 200 && resp.data) {
        const userInfo = resp.data as UserInfo;
        setTopics(userInfo.topics || {});
      }
    } catch (error) {
      console.error('获取用户Topics信息失败:', error);
    }
  };

  // 加载教室概览数据
  const loadClassroomOverview = async (dayNum: number) => {
    setLoading(true);
    try {
      const response = await getClassroomOverview(dayNum);
      if (response.code === 200) {
        setOverviewData(response.data);
      } else {
        console.error('获取教室概览失败:', response.message);
      }
    } catch (error) {
      console.error('获取教室概览失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始化
  useEffect(() => {
    loadUserTopics(); // 先加载 topics 数据
    loadClassroomOverview(currentDay);
    const today = new Date();
    setSelectedDate(today.toISOString().split('T')[0]);
  }, []);

  // 切换日期
  const handlePreviousDay = () => {
    const newDay = currentDay - 1;
    setCurrentDay(newDay);
    loadClassroomOverview(newDay);
    
    const date = new Date(newDay * 86400000);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const newDay = currentDay + 1;
    setCurrentDay(newDay);
    loadClassroomOverview(newDay);
    
    const date = new Date(newDay * 86400000);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleDateChange = (dateString: string) => {
    if (!dateString) {
      setShowDatePicker(false);
      return;
    }

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      setShowDatePicker(false);
      return;
    }

    const dayNum = Math.floor(date.getTime() / 86400000);
    setCurrentDay(dayNum);
    setSelectedDate(dateString);
    loadClassroomOverview(dayNum);
    setShowDatePicker(false);
  };

  // 格式化日期为显示格式
  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // 比较日期（只比较年月日，忽略时间）
    const isSameDay = (date1: Date, date2: Date) => {
      return date1.getFullYear() === date2.getFullYear() &&
             date1.getMonth() === date2.getMonth() &&
             date1.getDate() === date2.getDate();
    };

    if (isSameDay(date, today)) {
      return '今天';
    } else if (isSameDay(date, tomorrow)) {
      return '明天';
    } else if (isSameDay(date, yesterday)) {
      return '昨天';
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      });
    }
  };

  // 格式化日期显示
  const formatDate = (dayNum: number) => {
    const date = new Date(dayNum * 86400000);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  // 获取课程在表格中的位置和跨度信息
  const getLessonCellInfo = (lesson: ClassroomLesson) => {
    const startTime = new Date(lesson.start_time * 1000);
    const endTime = new Date(lesson.end_time * 1000);
    
    const startHour = startTime.getHours();
    const startMinute = startTime.getMinutes();
    const endHour = endTime.getHours();
    const endMinute = endTime.getMinutes();

    // 计算开始和结束的时间段索引
    const startSlot = Math.floor(((startHour - 9) * 60 + startMinute) / 30);
    const endSlot = Math.ceil(((endHour - 9) * 60 + endMinute) / 30);

    return { 
      startSlot: Math.max(0, startSlot), 
      rowSpan: Math.max(1, endSlot - startSlot) 
    };
  };

  // 获取课程的学生列表
  const getLessonStudents = (classId: number) => {
    if (!overviewData?.class_student) return [];
    return overviewData.class_student[classId] ?? [];
  };

  const getLessonTopicName = (lesson: ClassroomLesson) => {
    const topicId = lesson.topic_id;

    if (topicId === null || topicId === undefined) {
      return '未设置Topic';
    }

    const topicKey = String(topicId);
    const topicName = topics[topicKey];

    return topicName || `Topic ${topicId}`;
  };

  // 根据课程主题ID获取颜色
  const getLessonColor = (lesson: ClassroomLesson) => {
    const topicId = lesson.topic_id || 0;
    return LESSON_COLOR_CLASSES[Math.abs(topicId) % LESSON_COLOR_CLASSES.length];
  };

  // 创建教室课程映射表 - 课程可以跨越多个格子
  const createRoomLessonsMap = () => {
    if (!overviewData || rooms.length === 0) {
      return { cellMap: {} as Record<number, Array<ClassroomLesson | null | undefined>>, cellSpan: {} as Record<number, Array<number>> };
    }

    const cellMap: Record<number, Array<ClassroomLesson | null | undefined>> = {};
    const cellSpan: Record<number, Array<number>> = {};

    rooms.forEach(({ roomId }) => {
      cellMap[roomId] = Array(timeSlots.length).fill(undefined);
      cellSpan[roomId] = Array(timeSlots.length).fill(1);
    });

    overviewData.lessons.forEach(lesson => {
      const { startSlot, rowSpan } = getLessonCellInfo(lesson);
      const roomId = lesson.room_id;

      if (!cellMap[roomId] || startSlot < 0 || startSlot >= timeSlots.length) {
        return;
      }

      cellMap[roomId][startSlot] = lesson;
      cellSpan[roomId][startSlot] = rowSpan;

      // 标记跨越的格子为 null，表示被占用但不渲染
      for (let i = 1; i < rowSpan && startSlot + i < timeSlots.length; i++) {
        cellMap[roomId][startSlot + i] = null;
      }
    });

    return { cellMap, cellSpan };
  };

  // 格式化时间戳为时间字符串
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // 处理课程点击
  const handleLessonClick = (lesson: ClassroomLesson) => {
    setSelectedLesson(lesson);
    setShowLessonModal(true);
  };

  // 关闭课程详情模态框
  const closeLessonModal = () => {
    setShowLessonModal(false);
    setSelectedLesson(null);
  };

  const { cellMap, cellSpan } = useMemo(() => createRoomLessonsMap(), [overviewData, rooms, timeSlots]);

  const isoForCurrentDay = useMemo(() => {
    const date = new Date(currentDay * 86400000);
    return date.toISOString().split('T')[0];
  }, [currentDay]);

  const dateInputValue = selectedDate || isoForCurrentDay;
  const displayDateLabel = dateInputValue ? formatDisplayDate(dateInputValue) : '';
  const fullDateLabel = formatDate(currentDay);
  const noData = !loading && (!overviewData || roomsByCampus.length === 0);

  const legendItems = useMemo(() => {
    if (!overviewData) return [] as Array<{ topicId: number; name: string; colorClass: string }>;

    const topicMap = new Map<number, { name: string; colorClass: string }>();

    overviewData.lessons.forEach(lesson => {
      const topicMapKey = lesson.topic_id ?? -1;
      if (topicMap.has(topicMapKey)) return;

      const normalizedTopicId = lesson.topic_id ?? 0;
      const colorClass = LESSON_COLOR_CLASSES[Math.abs(normalizedTopicId) % LESSON_COLOR_CLASSES.length];

      let topicName = '未设置Topic';
      if (lesson.topic_id !== null && lesson.topic_id !== undefined) {
        const topicKey = String(lesson.topic_id);
        topicName = topics[topicKey] || `Topic ${lesson.topic_id}`;
      }

      topicMap.set(topicMapKey, { name: topicName, colorClass });
    });

    return Array.from(topicMap.entries()).map(([topicId, value]) => ({ topicId, ...value }));
  }, [overviewData, topics]);

  // 权限检查
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">权限不足</h2>
          <p className="text-gray-600">您没有权限访问此页面</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">教室使用概览</h1>
            <p className="text-sm text-gray-600 mt-1">{fullDateLabel}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePreviousDay}
              className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              前一天
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDatePicker(prev => !prev)}
                className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                <CalendarIcon className="h-4 w-4" />
                {displayDateLabel || '选择日期'}
              </button>
              {showDatePicker && (
                <div className="absolute right-0 top-11 z-10 rounded-md bg-white p-2 shadow-lg ring-1 ring-black/10">
                  <input
                    type="date"
                    value={dateInputValue}
                    onChange={event => handleDateChange(event.target.value)}
                    onBlur={() => setShowDatePicker(false)}
                    className="block w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleNextDay}
              className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              后一天
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-white px-4 py-16 text-sm text-gray-500">
            <ClockIcon className="h-5 w-5 animate-pulse" /> 正在加载教室数据...
          </div>
        ) : noData ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-16 text-center text-sm text-gray-500">
            <BuildingOfficeIcon className="mx-auto mb-3 h-8 w-8 text-gray-400" />
            暂无教室信息或当天没有排课。
          </div>
        ) : (
          roomsByCampus.map(campus => (
            <section key={campus.campusId} className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <div className="flex items-center gap-2 text-base font-medium text-gray-900">
                  <BuildingOfficeIcon className="h-5 w-5 text-blue-500" />
                  {campus.campusName || '未命名校区'}
                </div>
                <span className="text-sm text-gray-500">共 {campus.rooms.length} 间教室</span>
              </header>

              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '90px' }} />
                    {campus.rooms.map(room => (
                      <col key={room.roomId} style={{ minWidth: '180px' }} />
                    ))}
                  </colgroup>
                  <thead>
                    <tr className="bg-gray-100 text-left text-sm text-gray-600">
                      <th className="sticky left-0 z-20 border-b border-gray-200 bg-gray-100 px-3 py-2 font-medium shadow-sm">
                        <div className="flex items-center gap-1">
                          时间
                        </div>
                      </th>
                      {campus.rooms.map(room => (
                        <th key={room.roomId} className="border-b border-gray-200 px-3 py-2 font-medium text-gray-700">
                          {room.roomName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map((slot, slotIndex) => {
                      const hourBlock = Math.floor(slotIndex / 2);
                      const rowBg = hourBlock % 2 === 0 ? 'bg-white' : 'bg-gray-50';
                      return (
                        <tr key={slot.time} style={{ height: '3rem' }}>
                          <td
                            className={`sticky left-0 z-10 border-b border-gray-100 px-3 py-2 text-xs font-medium text-gray-500 shadow-sm ${rowBg}`}
                          >
                            {slot.time}
                          </td>
                          {campus.rooms.map(room => {
                            const lessonsForRoom = cellMap[room.roomId] ?? [];
                            const currentCell = lessonsForRoom[slotIndex];
                            
                            if (currentCell === null) {
                              // 被跨越的格子，不渲染
                              return null;
                            }

                            if (currentCell) {
                              const span = cellSpan[room.roomId]?.[slotIndex] ?? 1;
                              const colorClass = getLessonColor(currentCell);
                              const needsDarkText = colorClass.includes('yellow') || colorClass.includes('orange');
                              const containerTextClass = needsDarkText ? 'text-gray-900' : 'text-white';
                              const subtleTextClass = needsDarkText ? 'text-gray-700' : 'text-blue-100';
                              const students = getLessonStudents(currentCell.class_id);
                              const studentsDisplay = students.length > 0 ? students.join('、') : '暂无学生信息';
                              const topicName = getLessonTopicName(currentCell);

                              return (
                                <td
                                  key={room.roomId}
                                  rowSpan={span}
                                  className="border-b border-gray-100 p-0 align-top"
                                >
                                  <div
                                    onClick={() => handleLessonClick(currentCell)}
                                    className={`w-full h-full rounded-sm border-l-4 px-2 py-1 text-xs cursor-pointer hover:opacity-90 transition-opacity flex flex-col justify-center ${colorClass} ${containerTextClass}`}
                                    style={{ minHeight: `${span * 3}rem` }}
                                  >
                                    <div className="text-sm font-semibold leading-tight">{currentCell.teacher_name || '未设置教师'}</div>
                                    <div className={`text-xs font-medium leading-tight ${containerTextClass}`}>{topicName}</div>
                                    <div className={`text-[10px] leading-tight ${subtleTextClass} mt-1`}>
                                      {formatTime(currentCell.start_time)} - {formatTime(currentCell.end_time)}
                                    </div>
                                    <div className={`text-[10px] leading-tight ${containerTextClass} mt-1`} title={studentsDisplay}>
                                      学生：{students.length > 0 ? students.slice(0, 3).join('、') : '暂无'}
                                      {students.length > 3 ? ` 等${students.length}人` : ''}
                                    </div>
                                  </div>
                                </td>
                              );
                            }

                            return (
                              <td
                                key={room.roomId}
                                className={`border-b border-gray-100 px-2 align-middle text-xs text-gray-300 ${rowBg}`}
                                style={{ height: '3rem' }}
                              >
                                空闲
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))
        )}

        {/* 课程详情模态框 */}
        {showLessonModal && selectedLesson && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">课程详情</h3>
                <button
                  onClick={closeLessonModal}
                  className="rounded-md p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              
              <div className="px-6 py-4 space-y-4">
                {/* 基本信息 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <AcademicCapIcon className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="text-sm text-gray-500">教师</div>
                      <div className="font-medium">{selectedLesson.teacher_name || '未设置教师'}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`h-4 w-4 rounded border ${getLessonColor(selectedLesson)}`} />
                    <div>
                      <div className="text-sm text-gray-500">Topic</div>
                      <div className="font-medium">{getLessonTopicName(selectedLesson)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <ClockIcon className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="text-sm text-gray-500">时间</div>
                      <div className="font-medium">
                        {formatTime(selectedLesson.start_time)} - {formatTime(selectedLesson.end_time)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <BuildingOfficeIcon className="h-5 w-5 text-purple-500" />
                    <div>
                      <div className="text-sm text-gray-500">教室</div>
                      <div className="font-medium">
                        {rooms.find(r => r.roomId === selectedLesson.room_id)?.roomName || '未知教室'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 学生列表 */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <UserIcon className="h-5 w-5 text-orange-500" />
                    <span className="font-medium text-gray-900">学生列表</span>
                  </div>
                  
                  {(() => {
                    const students = getLessonStudents(selectedLesson.class_id);
                    if (students.length === 0) {
                      return (
                        <div className="text-sm text-gray-500 text-center py-4">
                          暂无学生信息
                        </div>
                      );
                    }
                    
                    return (
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600 mb-2">共 {students.length} 人</div>
                        <div className="max-h-32 overflow-y-auto">
                          {students.map((student, index) => (
                            <div key={index} className="text-sm text-gray-700 py-1 px-2 bg-gray-50 rounded mb-1">
                              {student}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="border-t border-gray-200 px-6 py-4">
                <button
                  onClick={closeLessonModal}
                  className="w-full rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
