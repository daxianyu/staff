'use client';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Calendar, momentLocalizer, Views, View } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/zh-cn';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './schedule.css';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon, UserGroupIcon, AcademicCapIcon, XMarkIcon } from '@heroicons/react/24/outline';

import {
  getClassroomSchedule,
  type ClassroomLessonInfo,
} from '@/services/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { type ScheduleEvent } from './hooks/useScheduleData';
import { EventItem } from './components/EventItem';

moment.locale('zh-cn');
const localizer = momentLocalizer(moment);

export default function SchedulePage() {
  const { hasPermission } = useAuth();
  const searchParams = useSearchParams();
  const urlRoomId = searchParams.get('room_id');

  const getCurrentRoomId = () => {
    if (urlRoomId) return urlRoomId;
    return '';
  };
  const roomId = getCurrentRoomId();
  const router = useRouter();
  
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);

  const [roomInfo, setRoomInfo] = useState<{
    name: string;
    id: string;
    campus_name?: string;
  } | null>(null);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const calendarRef = useRef<HTMLDivElement>(null);

  // week num（从 1970-01-01 + 偏移到周一）
  const weekNum = useMemo(() => {
    const startEpoch = new Date(1970, 0, 1);
    const diff = date.getTime() - startEpoch.getTime();
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const adjustedDays = days - 4; // align Monday
    return String(adjustedDays < 0 ? 0 : Math.floor(adjustedDays / 7));
  }, [date]);

  // 头部标题
  const title = useMemo(() => {
    if (view === Views.WEEK) {
      const s = moment(date).startOf('week');
      const e = moment(date).endOf('week');
      if (s.year() === e.year() && s.month() === e.month()) return `${s.format('YYYY年MM月DD日')} - ${e.format('DD日')}`;
      if (s.year() === e.year()) return `${s.format('YYYY年MM月DD日')} - ${e.format('MM月DD日')}`;
      return `${s.format('YYYY年MM月DD日')} - ${e.format('YYYY年MM月DD日')}`;
    }
    return moment(date).format('YYYY年MM月DD日 dddd');
  }, [date, view]);

  // 拉取教室课表数据
  const fetchClassroomSchedule = useCallback(async () => {
    if (!roomId || view !== Views.WEEK) {
      return;
    }
    try {
      const resp = await getClassroomSchedule(roomId, weekNum);
      console.log('getClassroomSchedule response:', resp);
      if (resp.status === 200 && resp.data) {
        // 转换课程数据为ScheduleEvent格式
        const lessonEvents: ScheduleEvent[] = resp.data.map((lesson: ClassroomLessonInfo) => ({
          id: `lesson_${lesson.id}`,
          title: lesson.subject_info.topic_name,
          start: new Date(lesson.start_time * 1000),
          end: new Date(lesson.end_time * 1000),
          type: 'lesson' as const,
          room_name: lesson.room_name,
          room_id: lesson.room_id,
          students: lesson.student_names.join(', '), // 转换为字符串
          student_ids: lesson.student_ids,
          subject_id: lesson.subject_id,
          teacher_name: lesson.subject_info.teacher_name,
          class_name: lesson.class_name,
          class_id: lesson.subject_info.class_id,
        }));
        
        setEvents(lessonEvents);
        
        // 设置教室信息
        if (resp.data.length > 0) {
          setRoomInfo({
            name: resp.data[0].room_name,
            id: roomId,
          });
        } else {
          setRoomInfo({
            name: `教室 ${roomId}`,
            id: roomId,
          });
        }
      }
    } catch (error) {
      console.error('获取教室课表失败:', error);
    }
  }, [roomId, weekNum, view]);

  useEffect(() => {
    fetchClassroomSchedule();
  }, [fetchClassroomSchedule]);

  // 刷新数据的函数
  const refresh = useCallback(() => {
    return fetchClassroomSchedule();
  }, [fetchClassroomSchedule]);

  // RBC min/max：用当天时间
  const dayMin = useMemo(() => moment(date).hour(9).minute(0).second(0).toDate(), [date]);
  const dayMax = useMemo(() => moment(date).hour(22).minute(0).second(0).toDate(), [date]);

  // 点击事件处理 - 显示课程详细信息
  const handleSelectEvent = useCallback((event: ScheduleEvent) => {
    if (event.type === 'selected') return;
    setSelectedEvent(event);
    setShowEventDetails(true);
  }, []);

  // 导航：只改日期
  const navigate = useCallback((action: 'PREV' | 'NEXT' | 'TODAY') => {
    setDate(prev => {
      const d = new Date(prev);
      if (action === 'PREV') d.setDate(prev.getDate() - (view === Views.WEEK ? 7 : 1));
      if (action === 'NEXT') d.setDate(prev.getDate() + (view === Views.WEEK ? 7 : 1));
      if (action === 'TODAY') return new Date();
      return d;
    });
  }, [view]);





  // 样式
  const eventStyleGetter = useCallback((event: ScheduleEvent) => {
    let backgroundColor = 'rgba(59,130,246,0.8)';
    let borderColor = '#2563eb';
    const style: React.CSSProperties = { color: 'white', border: `1px solid ${borderColor}`, borderRadius: '4px', fontSize: 12, zIndex: 1 };

    switch (event.type) {
      case 'lesson': backgroundColor = 'rgba(59,130,246,0.8)'; borderColor = '#2563eb'; break;
      case 'selected': backgroundColor = 'rgba(216,27,96,0.8)'; borderColor = 'rgb(216,27,96)'; Object.assign(style, { borderRadius: '8px', boxShadow: '0 0 15px 0 rgba(0,0,0,.2)', zIndex: 15 }); break;
    }
    style.backgroundColor = backgroundColor; style.border = `1px solid ${borderColor}`;
    return { style };
  }, []);

  // 教室课表只显示课程事件，不支持选区
  const allEvents = useMemo(() => events, [events]);

  console.log(selectedEvent);

  if (!roomId) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 overflow-auto">
        <div className="bg-white shadow-sm border-b border-gray-200 px-3 sm:px-6 py-4">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">教室课程表</h1>
              <p className="text-red-600 text-sm mt-1">错误：缺少必需的 room_id 参数</p>
              <p className="text-gray-600 text-sm">请在URL中添加 ?room_id=教室ID 参数</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">参数错误</h2>
            <p className="text-gray-600">页面需要 room_id 参数才能显示教室课表</p>
            <p className="text-gray-500 text-sm mt-2">示例: /classroom/schedule?room_id=123</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-auto">
      <div className="bg-white shadow-sm border-b border-gray-200 px-3 sm:px-6 py-4 sticky top-0 z-40 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">{roomInfo ? `${roomInfo.name} 课程表` : '教室课程表'}</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button onClick={() => setView(Views.DAY)} className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition-colors ${view === Views.DAY ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>日</button>
              <button onClick={() => setView(Views.WEEK)} className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition-colors ${view === Views.WEEK ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>周</button>
            </div>
          </div>
        </div>

        {/* 图例 */}
        <div className="flex items-center flex-wrap gap-3 sm:gap-6 mt-4 text-xs sm:text-sm">
          <div className="flex items-center space-x-1 sm:space-x-2"><div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded"></div><span className="text-gray-600 whitespace-nowrap">课程</span></div>
          {roomInfo && (
            <div className="text-gray-600">
              教室ID: {roomInfo.id}
            </div>
          )}
        </div>
      </div>

      {/* 日历主体 */}
      <div className="flex-1 pt-3 sm:pt-6">
        <div ref={calendarRef} className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-1">
              <button onClick={() => navigate('PREV')} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="上一页"><ChevronLeftIcon className="h-5 w-5" /></button>
              <button onClick={() => navigate('TODAY')} className="px-3 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors">今天</button>
              <button onClick={() => navigate('NEXT')} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="下一页"><ChevronRightIcon className="h-5 w-5" /></button>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{title}</h2>
            <div className="w-20"></div>
          </div>

          <Calendar
            localizer={localizer}
            events={allEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ padding: '0 20px 20px 20px' }}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            onSelectEvent={handleSelectEvent}
            selectable={false}
            eventPropGetter={eventStyleGetter}
            toolbar={false}
            min={dayMin}
            max={dayMax}
            step={15}
            timeslots={2}
            showMultiDayTimes={false}
            popup={false}
            components={{ event: EventItem }}
            messages={{ next: '下一页', previous: '上一页', today: '今天', month: '月', week: '周', day: '日', agenda: '议程', date: '日期', time: '时间', event: '事件', noEventsInRange: '此时间范围内没有事件', showMore: t => `+${t} 更多` }}
            formats={{ timeGutterFormat: 'HH:mm', eventTimeRangeFormat: ({ start, end }) => `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`, dayHeaderFormat: 'MM月DD日 dddd', dayRangeHeaderFormat: ({ start, end }) => `${moment(start).format('MM月DD日')} - ${moment(end).format('DD日')}` }}
          />
        </div>
      </div>

      {/* 课程详情模态框 */}
      {showEventDetails && selectedEvent && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => setShowEventDetails(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={() => setShowEventDetails(false)}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
                  <AcademicCapIcon className="h-6 w-6 mr-2 text-blue-500" />
                  Lesson Details
                </h3>

                <div className="space-y-4">
                  {/* 课程名称 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lesson Name
                    </label>
                    <div className="text-lg font-medium text-gray-900">
                      {selectedEvent.title}
                    </div>
                  </div>

                  {/* 时间信息 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time
                      </label>
                      <div className="flex items-center text-sm text-gray-900">
                        <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {moment(selectedEvent.start).format('YYYY-MM-DD HH:mm')}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time
                      </label>
                      <div className="flex items-center text-sm text-gray-900">
                        <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {moment(selectedEvent.end).format('YYYY-MM-DD HH:mm')}
                      </div>
                    </div>
                  </div>

                  {/* 教师信息 */}
                  {(selectedEvent as any).teacher_name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teacher
                      </label>
                      <div className="flex items-center text-sm text-gray-900">
                        <AcademicCapIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {(selectedEvent as any).teacher_name}
                      </div>
                    </div>
                  )}

                  {(selectedEvent as any).class_name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Class
                      </label>
                      <div className="text-sm">
                        {hasPermission(PERMISSIONS.EDIT_CLASSES) && selectedEvent.class_id ? (
                          <button
                            type="button"
                            className="text-blue-600 hover:text-blue-800 underline cursor-pointer bg-transparent border-0 p-0"
                            onClick={() => router.push(`/class/edit?id=${selectedEvent.class_id}`)}
                          >
                            {(selectedEvent as any).class_name}
                          </button>
                        ) : (
                          <span className="text-gray-900">
                            {(selectedEvent as any).class_name}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 教室信息 */}
                  {selectedEvent.room_name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Room
                      </label>
                      <div className="text-sm text-gray-900">
                        {selectedEvent.room_name}
                      </div>
                    </div>
                  )}

                  {/* 学生信息 */}
                  {selectedEvent.students && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Students
                      </label>
                      <div className="flex items-center text-sm text-gray-900">
                        <UserGroupIcon className="h-4 w-4 mr-1 text-gray-400" />
                        <span>{selectedEvent.students}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowEventDetails(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
