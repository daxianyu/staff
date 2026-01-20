'use client';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Calendar, momentLocalizer, Views, View } from 'react-big-calendar';
import moment from 'moment-timezone';
import 'moment/locale/zh-cn';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './schedule.css';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import AddEventModal from './components/AddEventModal';
import {
  getClassSchedule, editClassLesson, addClassLesson, deleteClassLesson,
  type ClassScheduleData, type ClassScheduleLesson
} from '@/services/auth';
import { useSearchParams } from 'next/navigation';
import { useScheduleData, type ScheduleEvent } from './hooks/useScheduleData';
import { EventItem } from './components/EventItem';
import { calculateModalPosition } from '@/utils/calculateModalPosition';

// === 策略 ===
import { InvigilateStrategy } from './strategies/invigilate';
import { UnavailableStrategy } from './strategies/unavailable';
import { LessonStrategy } from './strategies/lesson';
import type { EventTypeStrategy } from './strategies/types';

moment.tz.setDefault("Asia/Shanghai");
moment.locale('zh-cn');
const localizer = momentLocalizer(moment);

// 可注入的策略集合（父组件控制暴露哪些）
const STRATEGIES: Record<string, EventTypeStrategy<any>> = {
  invigilate: InvigilateStrategy,
  unavailable: UnavailableStrategy,
  lesson: LessonStrategy,
};

export default function SchedulePage() {
  const searchParams = useSearchParams();
  const urlClassId = searchParams.get('class_id');

  const getCurrentClassId = () => {
    if (urlClassId) return urlClassId;
    // 如果没有从URL获取到classId，可能需要从其他地方获取或显示错误
    return '';
  };
  const classId = getCurrentClassId();
  
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState<moment.Moment>(moment());
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTimeRange, setSelectedTimeRange] = useState<{ start: Date; end: Date } | null>(null);
  const [modalPosition, setModalPosition] = useState<{ x: number; y: number; slideDirection?: 'left' | 'right' | 'center' }>();
  const [isClosingModal, setIsClosingModal] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false);
  const [apiErrors, setApiErrors] = useState<{
    teacher_error?: string[];
    student_error?: string[];
    room_error?: string[];
  } | null>(null);

  const [classInfo, setClassInfo] = useState<ClassScheduleData | null>(null);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [roomUsage, setRoomUsage] = useState<Record<number, number[][]>>({});
  const [occupiedRanges, setOccupiedRanges] = useState<Array<{start: Date; end: Date}>>([]);
  const [lastMousePosition, setLastMousePosition] = useState<{
    x: number;
    y: number;
    target?: EventTarget | null;
  }>();
  const calendarRef = useRef<HTMLDivElement>(null);

  // week num（从 1970-01-01 + 偏移到周一）
  const weekNum = useMemo(() => {
    const startEpoch = moment('1970-01-01');
    const diff = date.diff(startEpoch, 'days');
    const adjustedDays = diff - 4; // align Monday
    return String(adjustedDays < 0 ? 0 : Math.floor(adjustedDays / 7));
  }, [date]);

  // 头部标题
  const title = useMemo(() => {
    if (view === Views.WEEK) {
      const s = date.clone().startOf('week');
      const e = date.clone().endOf('week');
      if (s.year() === e.year() && s.month() === e.month()) return `${s.format('YYYY年MM月DD日')} - ${e.format('DD日')}`;
      if (s.year() === e.year()) return `${s.format('YYYY年MM月DD日')} - ${e.format('MM月DD日')}`;
      return `${s.format('YYYY年MM月DD日')} - ${e.format('YYYY年MM月DD日')}`;
    }
    return date.format('YYYY年MM月DD日 dddd');
  }, [date, view]);

  // 拉取班级课表数据
  const fetchClassSchedule = useCallback(async () => {
    if (!classId || view !== Views.WEEK) {
      console.log('fetchClassSchedule skipped:', { classId, viewIsWeek: view === Views.WEEK });
      return;
    }
    try {
      const resp = await getClassSchedule(classId, weekNum);
      if (resp.status === 200 && resp.data) {
        setClassInfo(resp.data);
        
        // 转换课程数据为ScheduleEvent格式（使用默认时区：东八区）
        const lessonEvents: ScheduleEvent[] = resp.data.lessons.map((lesson: ClassScheduleLesson) => ({
          id: `lesson_${lesson.id}`,
          title: lesson.topic_name,
          start: moment.unix(lesson.start_time).toDate(),
          end: moment.unix(lesson.end_time).toDate(),
          type: 'lesson' as const,
          room_name: lesson.room_name,
          room_id: lesson.room_id,
          students: lesson.students,
          student_ids: lesson.student_ids,
          subject_id: lesson.subject_id,
        }));
        
        setEvents(lessonEvents);
        setRoomUsage(resp.data.room_taken);
        
        // 解析 lesson_data 为占用的时间范围
        let occupied: Array<{start: Date; end: Date}> = [];
        if (resp.data.lesson_data && resp.data.lesson_data.length > 0) {
          occupied = resp.data.lesson_data.map(ld => ({
            start: moment.unix(ld.start_time).toDate(),
            end: moment.unix(ld.end_time).toDate()
          }));
        }
        
        // 如果只有一个 subject，将监考时间加入不可用时间范围
        const classSubjects = resp.data.class_subjects || [];
        const teacherInvigilate = resp.data.teacher_invigilate;
        if (classSubjects.length === 1 && teacherInvigilate) {
          const subject = classSubjects[0];
          const teacherId = String(subject.teacher_id);
          const invigilateList = teacherInvigilate[teacherId] || [];
          if (invigilateList.length > 0) {
            const invigilateRanges = invigilateList.map((inv: any) => ({
              start: moment.unix(inv.start_time).toDate(),
              end: moment.unix(inv.end_time).toDate()
            }));
            occupied = [...occupied, ...invigilateRanges];
            console.log('Added invigilate ranges to occupied ranges:', invigilateRanges);
          }
        }
        
        setOccupiedRanges(occupied);
      }
    } catch (error) {
      console.error('获取班级课表失败:', error);
    }
  }, [classId, weekNum, view]);

  useEffect(() => {
    fetchClassSchedule();
  }, [fetchClassSchedule]);

  // 应用占用时间槽的阴影效果
  useEffect(() => {
    if (!occupiedRanges.length) return;
    
    // 延迟执行，确保日历已渲染
    const timer = setTimeout(() => {
      
      // 清除之前的样式
      document.querySelectorAll('.occupied-time').forEach(el => {
        el.classList.remove('occupied-time');
      });
      
      // 查找日期列中的时间槽（不是左侧时间轴）
      // 在 react-big-calendar 中，日期列的结构是：.rbc-time-content > .rbc-time-gutter (时间轴) + 多个日期列
      const timeContent = document.querySelector('.rbc-time-content');
      if (!timeContent) {
        console.log('No time content found');
        return;
      }
      
      // 查找所有日期列（排除时间轴）
      const dateColumns = Array.from(timeContent.children).filter(child => 
        !child.classList.contains('rbc-time-gutter')
      );
      console.log('Found date columns:', dateColumns.length);
      
      // 获取当前周的日期信息
      const startOfWeek = date.clone().startOf('week');
      
      // 为每个日期列匹配对应的日期
      dateColumns.forEach((column, colIndex) => {
        const columnDate = startOfWeek.clone().add(colIndex, 'days');
                
        // 在这个日期列中查找时间槽
        const slots = column.querySelectorAll('.rbc-time-slot');
        
        // 处理这个日期列中的时间槽
        slots.forEach((slot, slotIndex) => {
          const slotElement = slot as HTMLElement;
          
          // 通过索引计算时间（不依赖时间文本）
          // 日历配置：step=15（每个slot 15分钟），min=9:00
          const slotMinutes = slotIndex * 15;
          const startMinutes = 9 * 60; // dayMin是9:00
          const actualMinutes = startMinutes + slotMinutes;
          const hour = Math.floor(actualMinutes / 60);
          const minute = actualMinutes % 60;
          
          // 确保时间有效（在9:00-22:00范围内）
          if (hour >= 9 && hour < 22) {
            // 检查这个时间槽是否在占用范围内
            occupiedRanges.forEach(range => {
              const rangeMoment = moment(range.start);
              const rangeHour = rangeMoment.hour();
              const rangeMin = rangeMoment.minute();
              const rangeEndHour = moment(range.end).hour();
              const rangeEndMin = moment(range.end).minute();
              
              // 检查日期是否匹配
              const isSameDate = columnDate.isSame(rangeMoment, 'day');
              
              if (isSameDate) {
                const slotStart = hour * 60 + minute;
                const slotEnd = slotStart + 15; // 每个格子是15分钟
                const rangeStart = rangeHour * 60 + rangeMin;
                const rangeEnd = rangeEndHour * 60 + rangeEndMin;
                                
                // 如果时间槽与占用范围有重叠，添加样式
                if (slotStart < rangeEnd && slotEnd > rangeStart) {
                  slotElement.classList.add('occupied-time');
                  slotElement.style.backgroundColor = 'rgba(239, 68, 68, 0.3)';
                  slotElement.style.border = '2px solid rgba(239, 68, 68, 0.5)';
                }
              }
            });
          }
        });
      });
    }, 1000); // 增加延迟时间确保日历完全渲染
    
    return () => clearTimeout(timer);
  }, [occupiedRanges, date, view]);

  // 刷新数据的函数
  const refresh = useCallback(() => {
    return fetchClassSchedule();
  }, [fetchClassSchedule]);

  // RBC min/max：用当天时间
  const dayMin = useMemo(() => date.clone().hour(9).minute(0).second(0).toDate(), [date]);
  const dayMax = useMemo(() => date.clone().hour(22).minute(0).second(0).toDate(), [date]);

  // 冲突检查：课程和占用时间范围
  const hasConflict = useCallback((start: Date, end: Date) => {
    // 检查现有课程
    const lessonConflict = events.some(ev => 
      ev.type === 'lesson' && start < ev.end && end > ev.start
    );
    
    // 检查占用的时间范围（来自 lesson_data）
    const occupiedConflict = occupiedRanges.some(range => 
      start < range.end && end > range.start
    );
    
    return lessonConflict || occupiedConflict;
  }, [events, occupiedRanges]);

  // 记录最后一次鼠标位置，用于弹窗定位
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (calendarRef.current && calendarRef.current.contains(e.target as Node)) {
      setLastMousePosition({ x: e.clientX, y: e.clientY, target: e.target });
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [handleMouseDown]);

  // 选区 & 定位
  const handleSelectSlot = useCallback(
    ({ start, end, box }: any) => {
      setShowEditModal(false);
      const actualEnd = end || moment(start).add(30, 'minutes').toDate();
      if (hasConflict(start, actualEnd)) {
        alert('所选时间段与已有课程或占用时间重叠！');
        return;
      }
      setSelectedDate(start);
      setSelectedTimeRange({ start, end: actualEnd });

      // 使用统一的位置计算函数，若 box 不存在则回退到最后的鼠标位置
      const position = calculateModalPosition(box || lastMousePosition);
      setModalPosition(position);
      setIsClosingModal(false);
      setShowAddModal(true);
    },
    [hasConflict, lastMousePosition],
  );

  const handleSelectEvent = useCallback((event: ScheduleEvent) => {
    if (event.type === 'selected') return;
    setShowAddModal(false);
    setSelectedTimeRange(null);
    if (event.type === 'lesson') {
      setEditingEvent(event);
      setIsReadOnlyMode(false); // 班级课表中课程可以编辑
      setShowEditModal(true);
    }
  }, []);

  // 导航：只改日期
  const navigate = useCallback((action: 'PREV' | 'NEXT' | 'TODAY') => {
    setDate(prev => {
      const d = prev.clone();
      if (action === 'PREV') {
        if (view === Views.WEEK) {
          d.subtract(7, 'days');
        } else {
          d.subtract(1, 'day');
        }
      } else if (action === 'NEXT') {
        if (view === Views.WEEK) {
          d.add(7, 'days');
        } else {
          d.add(1, 'day');
        }
      } else if (action === 'TODAY') {
        return moment();
      }
      return d;
    });
  }, [view]);

  // 时间联动（AddEventModal 调整时间时）
  const onTimeChange = useCallback((startTime: string, endTime: string) => {
    if (!selectedDate) return;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const ns = new Date(selectedDate); ns.setHours(sh, sm, 0, 0);
    const ne = new Date(selectedDate); ne.setHours(eh, em, 0, 0);
    setSelectedTimeRange(prev => (prev ? { ...prev, start: ns, end: ne } : prev));
  }, [selectedDate]);

  // 关闭/动画完成
  const handleCloseModal = useCallback(() => { setIsClosingModal(true); setShowAddModal(false); }, []);
  const handleAnimationComplete = useCallback(() => {
    if (isClosingModal) {
      setIsClosingModal(false);
      setSelectedDate(undefined);
      setModalPosition(undefined);
      setSelectedTimeRange(null);
    }
  }, [isClosingModal]);



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

  // allEvents：如果有选区，加一个 selected 事件（用于视觉和定位）
  const allEvents = useMemo(() => {
    if (!selectedTimeRange) return events;
    return [...events, { id: 'selected-range', title: '选中时间段', start: selectedTimeRange.start, end: selectedTimeRange.end, type: 'selected' as const }];
  }, [events, selectedTimeRange]);

  // 如果没有classId，显示错误信息
  if (!classId) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 overflow-auto">
        <div className="bg-white shadow-sm border-b border-gray-200 px-3 sm:px-6 py-4">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">班级课程表</h1>
              <p className="text-red-600 text-sm mt-1">错误：缺少必需的 class_id 参数</p>
              <p className="text-gray-600 text-sm">请在URL中添加 ?class_id=班级ID 参数</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">参数错误</h2>
            <p className="text-gray-600">页面需要 class_id 参数才能显示班级课表</p>
            <p className="text-gray-500 text-sm mt-2">示例: /class/schedule?class_id=123</p>
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
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">{classInfo ? `${classInfo.class_name} 课程表` : '班级课程表'}</h1>
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
          {classInfo && (
            <div className="text-gray-600">
              校区: {classInfo.class_campus_name} | 班级ID: {classInfo.class_id}
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
            date={date.toDate()}
            onNavigate={(newDate) => setDate(moment(newDate))}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            selectable={!isClosingModal}
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

      {/* 错误信息展示 */}
      {apiErrors && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-red-600">操作失败</h3>
                <button
                  onClick={() => setApiErrors(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {apiErrors.teacher_error && apiErrors.teacher_error.length > 0 && (
                  <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
                    <h4 className="text-yellow-800 font-medium mb-2">教师错误：</h4>
                    <div className="text-yellow-700 space-y-1">
                      {apiErrors.teacher_error.map((error, index) => (
                        <div key={index} className="text-sm">{error}</div>
                      ))}
                    </div>
                  </div>
                )}

                {apiErrors.student_error && apiErrors.student_error.length > 0 && (
                  <div className="border-l-4 border-blue-400 bg-blue-50 p-4">
                    <h4 className="text-blue-800 font-medium mb-2">学生错误：</h4>
                    <div className="text-blue-700 space-y-1">
                      {apiErrors.student_error.map((error, index) => (
                        <div key={index} className="text-sm">{error}</div>
                      ))}
                    </div>
                  </div>
                )}

                {apiErrors.room_error && apiErrors.room_error.length > 0 && (
                  <div className="border-l-4 border-red-400 bg-red-50 p-4">
                    <h4 className="text-red-800 font-medium mb-2">教室错误：</h4>
                    <div className="text-red-700 space-y-1">
                      {apiErrors.room_error.map((error, index) => (
                        <div key={index} className="text-sm">{error}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setApiErrors(null)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新增弹窗：班级课程 */}
      <AddEventModal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        selectedDate={selectedDate}
        onTimeChange={onTimeChange}
        selectedTimeRange={selectedTimeRange || undefined}
        position={modalPosition}
        onAnimationComplete={handleAnimationComplete}
        onConflictCheck={(s, e) => []}
        scheduleData={classInfo || {}}
        mode="add"
        typeRegistry={STRATEGIES}
        allowedTypes={['lesson']}
        defaultType="lesson"
        api={{
          classId,
          weekNum,
          date: date.toDate(),
          addClassLesson: (p: any) => addClassLesson(p),
          editClassLesson: (p: any) => editClassLesson({ record_id: p.record_id, start_time: p.start_time, end_time: p.end_time, room_id: p.room_id, repeat_num: p.repeat_num } as any),
          deleteClassLesson: (p: any) => deleteClassLesson({ record_id: p.record_id, repeat_num: p.repeat_num } as any)
        }}
        unavailableRangesSec={occupiedRanges.map(r => ({
          start_time: Math.floor(r.start.getTime() / 1000),
          end_time: Math.floor(r.end.getTime() / 1000)
        }))}
        onSaved={refresh}
        onError={setApiErrors}
      />

      {/* 编辑弹窗：班级课程编辑 */}
      {showEditModal && editingEvent && (
        <AddEventModal
          isOpen={showEditModal}
          onClose={() => { setShowEditModal(false); setEditingEvent(null); setIsReadOnlyMode(false); }}
          selectedDate={editingEvent.start}
          onTimeChange={onTimeChange}
          position={modalPosition}
          onAnimationComplete={handleAnimationComplete}
          onConflictCheck={(s, e) => []}
          scheduleData={classInfo || {}}
          mode="edit"
          readOnly={isReadOnlyMode}
          initialEvent={editingEvent}
          onEditFromReadOnly={() => setIsReadOnlyMode(false)}
          typeRegistry={STRATEGIES}
          allowedTypes={['lesson']}
          defaultType="lesson"
          api={{
            classId,
            weekNum,
            date: date.toDate(),
            addClassLesson: (p: any) => addClassLesson(p),
            editClassLesson: (p: any) => editClassLesson({ record_id: p.record_id, start_time: p.start_time, end_time: p.end_time, room_id: p.room_id, repeat_num: p.repeat_num } as any),
            deleteClassLesson: (p: any) => deleteClassLesson({ record_id: p.record_id, repeat_num: p.repeat_num } as any)
          }}
          unavailableRangesSec={occupiedRanges.map(r => ({
            start_time: Math.floor(r.start.getTime() / 1000),
            end_time: Math.floor(r.end.getTime() / 1000)
          }))}
          onSaved={refresh}
          onError={setApiErrors}
        />
      )}
    </div>
  );
}
