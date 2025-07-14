'use client';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/zh-cn';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './schedule.css';
import { PlusIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import AddEventModal from './components/AddEventModal';
import { getStaffSchedule } from '@/services/auth';
import { useSearchParams } from 'next/navigation';

// 设置中文
moment.locale('zh-cn');
const localizer = momentLocalizer(moment);

// 模拟数据类型
interface ScheduleEvent {
  id: string;
  title: string; // 添加title字段
  start: Date;
  end: Date;
  teacherId: string;
  teacherName: string;
  type: 'lesson' | 'unavailable' | 'selected' | 'selectedRepeat';
  description?: string;
}

// 时间槽包装器的属性类型
interface TimeSlotWrapperProps {
  children: React.ReactNode;
  value: Date;
}

// 模拟课程数据
const mockEvents: ScheduleEvent[] = [
  {
    id: '1',
    title: '微积分基础',
    start: new Date(2025, 6, 1, 9, 0),
    end: new Date(2025, 6, 1, 10, 30),
    teacherId: 'teacher1',
    teacherName: '张老师',
    type: 'lesson',
    description: '微积分基础'
  },
  {
    id: '2',
    title: '力学原理',
    start: new Date(2025, 6, 1, 14, 0),
    end: new Date(2025, 6, 1, 15, 30),
    teacherId: 'teacher1',
    teacherName: '张老师',
    type: 'lesson',
    description: '力学原理'
  },
];

// 不可用时段数据 - 这些时间段会显示灰色背景
const unavailableTimeSlots = [
  {
    start: new Date(2025, 5, 30, 11, 30), 
    end: new Date(2025, 5, 30, 13, 30)    
  },
  {
    start: new Date(2025, 6, 1, 11, 30), 
    end: new Date(2025, 6, 1, 13, 30)    
  },
  {
    start: new Date(2025, 6, 2, 11, 30), 
    end: new Date(2025, 6, 2, 13, 30)    
  },
  {
    start: new Date(2025, 6, 3, 11, 30), 
    end: new Date(2025, 6, 3, 13, 30)    
  },
  {
    start: new Date(2025, 6, 4, 11, 30), 
    end: new Date(2025, 6, 4, 13, 30)    
  },
  {
    start: new Date(2025, 6, 5, 11, 30), 
    end: new Date(2025, 6, 5, 13, 30)    
  },
  {
    start: new Date(2025, 6, 6, 11, 30), 
    end: new Date(2025, 6, 6, 13, 30)    
  }
];

// 事件样式配置
const eventStyleGetter = (event: ScheduleEvent) => {
  let backgroundColor = 'rgba(49, 116, 173, 0.8)';
  let borderColor = '#3174ad';
  
  switch (event.type) {
    case 'lesson':
      backgroundColor = 'rgba(59, 130, 246, 0.8)'; // 蓝色 + 透明度
      borderColor = '#2563eb';
      break;
    case 'unavailable':
      backgroundColor = 'rgba(107, 114, 128, 0.8)'; // 灰色 + 透明度
      borderColor = '#4b5563';
      break;
    case 'selected':
      backgroundColor = 'rgba(216, 27, 96, 0.8)'; // 选中色 + 透明度
      borderColor = 'rgb(216, 27, 96)';
      break;
    case 'selectedRepeat':
      backgroundColor = 'rgba(245, 158, 11, 0.8)'; // 橙色
      borderColor = '#f59e0b';
      break;
  }

  return {
    style: {
      backgroundColor,
      borderColor,
      color: 'white',
      border: `1px solid ${borderColor}`,
      borderRadius: event.type === 'selected' ? '8px' : '4px',
      fontSize: '12px',
      boxShadow: event.type === 'selected' ? '0 0 15px 0 rgba(0, 0, 0, 0.2)' : 'none',
      zIndex: event.type === 'selected' ? 15 : 1
    }
  };
};

// 定义课表数据结构
interface StaffScheduleData {
  lessons: any[];
  special_day: any[];
  staff_class: Record<string, string>;
  students: Record<string, string>;
  campus_info: Record<string, string>;
  room_info: Record<string, string>;
  unavailable: any[];
}

type SelectedRange = { start: Date; end: Date; repeat?: 'none' | 'weekly' };

export default function SchedulePage() {
  const searchParams = useSearchParams();
  const staffId = searchParams.get('staffId') || '';
  const [events, setEvents] = useState<ScheduleEvent[]>(mockEvents);
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date()); // 默认显示当天
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [modalPosition, setModalPosition] = useState<{ x: number; y: number; slideDirection?: 'left' | 'right' | 'center' }>();
  const [isClosingModal, setIsClosingModal] = useState(false);
  const [lastMousePosition, setLastMousePosition] = useState<{ x: number; y: number; target?: EventTarget | null }>();
  const calendarRef = useRef<HTMLDivElement>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<SelectedRange | null>(null);

  // 新增：保存完整课表数据
  const [scheduleData, setScheduleData] = useState<StaffScheduleData | null>(null);

  // 统一处理课表数据的函数
  const handleScheduleData = useCallback((resp: any) => {
    if (resp && resp.data) {
      setScheduleData(resp.data);
      if (Array.isArray(resp.data.lessons)) {
        const newEvents = resp.data.lessons.map((lesson: any) => ({
          id: lesson.id || String(Math.random()),
          title: lesson.title || lesson.subject_name || '课程',
          start: new Date(lesson.start),
          end: new Date(lesson.end),
          teacherId: lesson.teacherId || staffId,
          teacherName: lesson.teacherName || '',
          type: 'lesson',
          description: lesson.description || ''
        }));
        setEvents(newEvents);
      } else {
        setEvents([]);
      }
    } else {
      setScheduleData(null);
      setEvents([]);
    }
  }, [staffId]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (calendarRef.current && calendarRef.current.contains(e.target as Node)) {
      setLastMousePosition({ 
        x: e.clientX, 
        y: e.clientY, 
        target: e.target 
      });
    }
  }, []);

  // 清除选中状态
  const clearSelectedState = useCallback(() => {
    setSelectedTimeRange(null);
  }, []);

  // 处理点击外部区域取消选择
  const handleClickOutside = useCallback((e: MouseEvent) => {
    const target = e.target as Node;
    
    // 检查是否点击在日历内部
    if (calendarRef.current && calendarRef.current.contains(target)) {
      return;
    }
    
    // 检查是否点击在模态框内部
    if (target instanceof Element) {
      const modalElement = target.closest('[data-modal="add-event"]');
      if (modalElement) {
        return; // 点击在模态框内部，不处理
      }
    }
    
    // 点击在日历和模态框外部，清除选中状态和关闭模态框
    if (selectedTimeRange || showAddModal) {
      clearSelectedState();
      if (showAddModal) {
        setIsClosingModal(true);
        setShowAddModal(false);
      }
    }
  }, [selectedTimeRange, showAddModal, clearSelectedState]);

  useEffect(() => {
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [handleMouseDown, handleClickOutside]);

  // 检查时间段是否与不可用时间段重合
  const checkTimeConflict = useCallback((start: Date, end: Date) => {
    const conflictingSlots = unavailableTimeSlots.filter(slot => {
      // 检查时间段是否在同一天
      const sameDay = moment(start).isSame(moment(slot.start), 'day');
      if (!sameDay) return false;
      
      // 检查时间段是否重合
      const startTime = moment(start);
      const endTime = moment(end);
      const slotStart = moment(slot.start);
      const slotEnd = moment(slot.end);
      
      // 时间段重合的条件：开始时间小于另一个结束时间，且结束时间大于另一个开始时间
      return startTime.isBefore(slotEnd) && endTime.isAfter(slotStart);
    });
    
    return conflictingSlots;
  }, []);

  // 处理时间段选择
  const handleSelectSlot = useCallback(({ start, end, box }: { start: Date; end?: Date; box?: { x: number; y: number; clientX: number; clientY: number } }) => {
    clearSelectedState();
    if (showAddModal) {
      setShowAddModal(false);
      setIsClosingModal(false);
    }
    
    setSelectedDate(start);
    
    // 保存选中的时间范围，用于创建虚拟选中事件
    const actualEnd = end || new Date(start.getTime() + 30 * 60 * 1000); // 默认30分钟
    setSelectedTimeRange({ start, end: actualEnd });
    // 计算模态框位置，优先使用box坐标，然后是鼠标位置，最后基于时间计算位置
    let modalX = 0;
    let modalY = 0;
    
    if (box && (box.clientX || box.x)) {
      // 使用box提供的坐标
      modalX = box.clientX || box.x;
      modalY = box.clientY || box.y;
    } else if (lastMousePosition) {
      // 使用记录的鼠标位置
      modalX = lastMousePosition.x;
      modalY = lastMousePosition.y;
      
      // 如果有target元素，尝试获取更精确的位置
      if (lastMousePosition.target && lastMousePosition.target instanceof HTMLElement) {
        const element = lastMousePosition.target;
        const rect = element.getBoundingClientRect();
        
                  // 查找最近的时间槽元素
          const timeSlot = element.closest('.rbc-time-slot, .rbc-day-slot, .rbc-date-cell');
          if (timeSlot) {
            const slotRect = timeSlot.getBoundingClientRect();
            
            // 立即进行位置判断
            const screenWidth = window.innerWidth;
            const modalWidth = 384;
            const leftSpace = slotRect.left;
            const rightSpace = screenWidth - slotRect.right;
            
            let slideDirection: 'left' | 'right' | 'center';
            if (rightSpace >= modalWidth + 30) {
              modalX = slotRect.right + 20;
              modalY = slotRect.top;
              slideDirection = 'right';
            } else if (leftSpace >= modalWidth + 30) {
              modalX = slotRect.left - modalWidth - 20;
              modalY = slotRect.top;
              slideDirection = 'left';
            } else {
              modalX = Math.max(10, Math.min(slotRect.left + (slotRect.width - modalWidth) / 2, screenWidth - modalWidth - 10));
              modalY = slotRect.bottom + 10;
              slideDirection = 'center';
            }
            
            // 直接设置带有滑动方向的位置
            setModalPosition({ x: modalX, y: modalY, slideDirection });
            setIsClosingModal(false);
            setShowAddModal(true);
            return; // 提前返回，不执行后续逻辑
                   } else {
              modalX = rect.right + 10;
              modalY = rect.top;
          }
      }
         } else {
               // 最后的fallback：使用屏幕中心
        modalX = window.innerWidth / 2;
        modalY = window.innerHeight / 2;
     }
    
    setModalPosition({ x: modalX, y: modalY, slideDirection: 'right' });
    
    setIsClosingModal(false);
    setShowAddModal(true);
  }, [lastMousePosition, clearSelectedState, showAddModal]);

  // 处理事件选择
  const handleSelectEvent = useCallback((event: ScheduleEvent) => {
    // 忽略选中状态的虚拟事件
    if (event.type === 'selected') {
      return;
    }
    
  }, []);

  // 添加新事件
  const handleAddEvent = useCallback((newEvent: Partial<ScheduleEvent> & { 
    repeat?: 'none' | 'weekly';
    subject?: string;
    campus?: string;
    pickRoom?: string;
    replaceRoomWhenBooked?: boolean;
  }) => {
    if (newEvent.repeat === 'weekly' && newEvent.start && newEvent.end) {
      const startMoment = moment(newEvent.start);
      const created: ScheduleEvent[] = [];
      for (let d = startMoment.clone(); d.day() <= 5; d.add(1, 'day')) {
        if (d.day() === 0 || d.day() === 6) continue; // skip weekend
        const start = d.clone().toDate();
        const duration = moment(newEvent.end).diff(moment(newEvent.start), 'minutes');
        const end = d.clone().add(duration, 'minutes').toDate();
        
        // 根据事件类型生成title
        let title = '事件';
        if (newEvent.type === 'lesson' && newEvent.subject) {
          title = newEvent.subject;
        } else if (newEvent.type === 'unavailable') {
          title = '不可用时间段';
        }
        
        created.push({
          id: `${Date.now()}-${d.day()}`,
          title,
          start,
          end,
          teacherId: newEvent.teacherId || 'system',
          teacherName: newEvent.teacherName || '系统',
          type: newEvent.type || 'lesson',
          description: newEvent.description || ''
        });
      }
      setEvents(prev => [...prev, ...created]);
    } else {
      // 根据事件类型生成title
      let title = '事件';
      if (newEvent.type === 'lesson' && newEvent.subject) {
        title = newEvent.subject;
      } else if (newEvent.type === 'unavailable') {
        title = '不可用时间段';
      }
      
      const event: ScheduleEvent = {
        ...newEvent as ScheduleEvent,
        id: Date.now().toString(),
        title
      };
      setEvents(prev => [...prev, event]);
    }
    // 清除虚拟选中状态
    setSelectedTimeRange(null);
  }, []);

  // 处理模态框关闭
  const handleCloseModal = useCallback(() => {
    setIsClosingModal(true);
    setShowAddModal(false);
  }, []);

  // 动画完成后清理状态
  const handleAnimationComplete = useCallback(() => {
    if (isClosingModal) {
      setIsClosingModal(false);
      setSelectedDate(undefined);
      setModalPosition(undefined);
      // 清除选中状态，让选中区域颜色消失
      clearSelectedState();
    }
  }, [isClosingModal, clearSelectedState]);

  // 合并真实事件和虚拟选中事件
  const allEvents = useMemo(() => {
    const eventsWithSelection = [...events];
    
    // 如果有选中的时间范围，添加虚拟选中事件
    if (selectedTimeRange) {
      if (selectedTimeRange.repeat === 'weekly') {
        // 生成从选中日期开始到本周周五的工作日虚拟事件
        const startMoment = moment(selectedTimeRange.start);
        for (let d = startMoment.clone(); d.day() <= 5; d.add(1, 'day')) {
          // 只包含工作日 (Monday=1 .. Friday=5)
          if (d.day() === 0 || d.day() === 6) continue; // 跳过周末
          const start = d.clone().hour(startMoment.hour()).minute(startMoment.minute()).toDate();
          const end = d.clone().hour(moment(selectedTimeRange.end).hour()).minute(moment(selectedTimeRange.end).minute()).toDate();
          const suffix = d.format('YYYYMMDD');
          eventsWithSelection.push({
            id: `selected-weekly-${suffix}`,
            title: '周内重复',
            start,
            end,
            teacherId: 'system',
            teacherName: '系统',
            type: 'selectedRepeat',
            description: '周内重复选择'
          });
        }
      } else {
        const selectedEvent: ScheduleEvent = {
          id: 'selected-time-range',
          title: '选中时间段',
          start: selectedTimeRange.start,
          end: selectedTimeRange.end,
          teacherId: 'system',
          teacherName: '系统',
          type: 'selected',
          description: '当前选中的时间段'
        };
        eventsWithSelection.push(selectedEvent);
      }
    }
    
    return eventsWithSelection;
  }, [events, selectedTimeRange]);

  // 获取当前周编号（1970年1月以来的周数）
  function getWeekNum(date: Date) {
    const start = new Date(1970, 0, 1);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
  }

  // 刷新课表数据的函数
  const refreshScheduleData = useCallback(async () => {
    if (!staffId || view !== Views.WEEK) return;
    
    const weekNum = getWeekNum(date);
    const resp = await getStaffSchedule(staffId, String(weekNum));
    handleScheduleData(resp);
  }, [staffId, date, view, handleScheduleData]);

  // 导航函数
  const navigate = useCallback(async (action: 'PREV' | 'NEXT' | 'TODAY') => {
    let newDate = new Date(date);

    switch (action) {
      case 'PREV':
        if (view === Views.WEEK) {
          newDate.setDate(date.getDate() - 7);
        } else if (view === Views.DAY) {
          newDate.setDate(date.getDate() - 1);
        }
        break;
      case 'NEXT':
        if (view === Views.WEEK) {
          newDate.setDate(date.getDate() + 7);
        } else if (view === Views.DAY) {
          newDate.setDate(date.getDate() + 1);
        }
        break;
      case 'TODAY':
        newDate = new Date();
        break;
    }

    setDate(newDate);

    // 只在周视图切换时请求课表
    if (view === Views.WEEK) {
      const weekNum = getWeekNum(newDate);
      const resp = await getStaffSchedule(staffId, String(weekNum));
      handleScheduleData(resp);
    }
  }, [date, view, staffId, handleScheduleData]);

  // 格式化日期标题
  const getDateTitle = useCallback(() => {
    if (view === Views.WEEK) {
      const start = moment(date).startOf('week');
      const end = moment(date).endOf('week');
      if (start.year() === end.year() && start.month() === end.month()) {
        return `${start.format('YYYY年MM月DD日')} - ${end.format('DD日')}`;
      } else if (start.year() === end.year()) {
        return `${start.format('YYYY年MM月DD日')} - ${end.format('MM月DD日')}`;
      } else {
        return `${start.format('YYYY年MM月DD日')} - ${end.format('YYYY年MM月DD日')}`;
      }
    } else if (view === Views.DAY) {
      return moment(date).format('YYYY年MM月DD日 dddd');
    }
    return '';
  }, [date, view]);

    // 创建自定义时间槽包装器 - 使用React Big Calendar的原生方式
  const CustomTimeSlotWrapper = useCallback((props: any) => {
    const { children, value } = props;
    // value 是当前时间槽的时间（Date对象）
    const slotTime = moment(value);
    
    // 检查这个时间槽是否在任何不可用时间范围内
    const isUnavailable = unavailableTimeSlots.some(unavailableSlot => {
      const startTime = moment(unavailableSlot.start);
      const endTime = moment(unavailableSlot.end);
      
      // 检查日期和时间是否都匹配
      const matches = slotTime.isSame(startTime, 'day') && 
                     slotTime.isBetween(startTime, endTime, 'minute', '[)');
      
      return matches;
    });
    
    if (isUnavailable) {
      // 如果不可用，包装一个带背景色的div
      return (
        <div className="unavailable-time-slot">
          {children}
        </div>
      );
    }
    
    // 如果可用，直接返回children（不添加额外DOM）
    return <>{children}</>;
  }, [unavailableTimeSlots]);

  // 监听虚拟事件的渲染，自动调整模态框位置
  useEffect(() => {
    if (selectedTimeRange && showAddModal) {
      // 多次尝试查找虚拟事件并调整位置
      const attempts = [50, 150, 300, 500];
      
      attempts.forEach(delay => {
        setTimeout(() => {
          if (calendarRef.current && showAddModal) {
            const selectedEvent = calendarRef.current.querySelector('[title="选中时间段"]') as HTMLElement;
            if (selectedEvent) {
              const rect = selectedEvent.getBoundingClientRect();
              const screenWidth = window.innerWidth;
              const modalWidth = 384; // w-96 = 384px
              
              // 计算最佳位置（左侧或右侧）
              const leftSpace = rect.left;
              const rightSpace = screenWidth - rect.right;
              const requiredSpace = modalWidth + 30; // 模态框宽度 + 30px间距
              
              let x, y, slideDirection: 'left' | 'right' | 'center';
              
              if (rightSpace >= requiredSpace) {
                // 右侧空间足够：从选中区域右边缘开始，向右偏移20px
                x = rect.right + 20;
                y = rect.top;
                slideDirection = 'right';
              } else if (leftSpace >= requiredSpace) {
                // 左侧空间足够：模态框右边缘距离选中区域左边缘20px
                x = rect.left - modalWidth - 20;
                y = rect.top;
                slideDirection = 'left';
              } else {
                // 空间不够，放在下方中心位置
                x = Math.max(10, Math.min(rect.left + (rect.width - modalWidth) / 2, screenWidth - modalWidth - 10));
                y = rect.bottom + 10;
                slideDirection = 'center';
              }
              
              setModalPosition({ x, y, slideDirection });
            }
          }
        }, delay);
      });
    }
  }, [selectedTimeRange, showAddModal]);

  useEffect(() => {
    if (!staffId) return;
    if (view === Views.WEEK) {
      const weekNum = getWeekNum(date);
      getStaffSchedule(staffId, String(weekNum)).then(handleScheduleData);
    }
    // eslint-disable-next-line
  }, [staffId, date, view, handleScheduleData]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-auto">
      {/* 头部导航 */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-3 sm:px-6 py-4 sticky top-0 z-40 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Schedule</h1>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* 视图切换 */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView(Views.DAY)}
                className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition-colors ${
                  view === Views.DAY
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                日
              </button>
              <button
                onClick={() => setView(Views.WEEK)}
                className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition-colors ${
                  view === Views.WEEK
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                周
              </button>
            </div>

            {/* 添加课程按钮 */}
            <button
              onClick={(e) => {
                // 首先清除上一次的选中状态和模态框
                clearSelectedState();
                if (showAddModal) {
                  setShowAddModal(false);
                  setIsClosingModal(false);
                }
                
                setSelectedDate(new Date());
                setModalPosition({ x: e.clientX, y: e.clientY, slideDirection: 'left' });
                setIsClosingModal(false);
                setShowAddModal(true);
              }}
              className="flex items-center space-x-1 sm:space-x-2 bg-blue-500 text-white px-2 sm:px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-xs sm:text-sm"
            >
              <PlusIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">添加课程</span>
              <span className="sm:hidden">添加</span>
            </button>
          </div>
        </div>

        {/* 图例 */}
        <div className="flex items-center flex-wrap gap-3 sm:gap-6 mt-4 text-xs sm:text-sm">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-600 whitespace-nowrap">课程</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-500 rounded"></div>
            <span className="text-gray-600 whitespace-nowrap">不可用事件</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-300 rounded"></div>
            <span className="text-gray-600 whitespace-nowrap">不可用时段</span>
          </div>
        </div>
      </div>

      {/* 日历主体 */}
      <div className="flex-1 pt-3 sm:pt-6">
        <div 
          ref={calendarRef} 
          className="bg-white rounded-lg shadow-sm border border-gray-200"
        >
          {/* 日期导航和标题 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            {/* 左侧：导航按钮 */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => navigate('PREV')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="上一页"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigate('TODAY')}
                className="px-3 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
              >
                今天
              </button>
              <button
                onClick={() => navigate('NEXT')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="下一页"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
            
            {/* 中间：日期标题 */}
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {getDateTitle()}
            </h2>
            
            {/* 右侧：占位，保持平衡 */}
            <div className="w-20"></div>
          </div>

          <Calendar
            localizer={localizer}
            events={allEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ 
              padding: '0 20px 20px 20px'
            }}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            selectable={!isClosingModal}
            eventPropGetter={eventStyleGetter}
            toolbar={false} // 隐藏默认工具栏
            min={new Date(2025, 0, 1, 9, 0, 0)} // 早上9点开始
            max={new Date(2025, 0, 1, 22, 0, 0)} // 晚上10点结束
            step={15} // 15分钟间隔
            timeslots={2} // 每小时2个时间槽
            showMultiDayTimes={false} // 不显示多日时间
            popup={false} // 不使用弹出窗口
            popupOffset={0} // 弹出偏移量
            components={{
              timeSlotWrapper: CustomTimeSlotWrapper, // 使用自定义时间槽包装器
            }}
            messages={{
              next: '下一页',
              previous: '上一页',
              today: '今天',
              month: '月',
              week: '周',
              day: '日',
              agenda: '议程',
              date: '日期',
              time: '时间',
              event: '事件',
              noEventsInRange: '此时间范围内没有事件',
              showMore: (total) => `+${total} 更多`
            }}
            formats={{
              timeGutterFormat: 'HH:mm',
              eventTimeRangeFormat: ({ start, end }) => 
                `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`,
              dayHeaderFormat: 'MM月DD日 dddd',
              dayRangeHeaderFormat: ({ start, end }) =>
                `${moment(start).format('MM月DD日')} - ${moment(end).format('DD日')}`
            }}
          />
        </div>
      </div>

      {/* 添加事件模态框 */}
      <AddEventModal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        onSave={handleAddEvent}
        selectedDate={selectedDate}
        selectedTimeRange={selectedTimeRange || undefined}
        position={modalPosition}
        onAnimationComplete={handleAnimationComplete}
        onConflictCheck={checkTimeConflict}
        scheduleData={scheduleData}
        staffId={staffId}
        onRefreshData={refreshScheduleData}
        onRepeatChange={(rep) => setSelectedTimeRange(prev => prev ? { ...prev, repeat: rep } : prev)}
      />
    </div>
  );
} 