'use client';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment';
import 'moment/locale/zh-cn';
import './mobile-schedule.css';
import { PlusIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import MobileAddEventModal from './components/MobileAddEventModal';

moment.locale('zh-cn');
const localizer = momentLocalizer(moment);

// 模拟数据类型
interface ScheduleEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  teacherId: string;
  teacherName: string;
  type: 'lesson' | 'unavailable' | 'selected';
  description?: string;
}

// 模拟课程数据
const mockEvents: ScheduleEvent[] = [
  {
    id: '1',
    title: '高三数学',
    start: new Date(2025, 6, 1, 9, 0),
    end: new Date(2025, 6, 1, 10, 30),
    teacherId: 'teacher1',
    teacherName: '张老师',
    type: 'lesson',
    description: '微积分基础'
  },
  {
    id: '2',
    title: '高二物理',
    start: new Date(2025, 6, 1, 14, 0),
    end: new Date(2025, 6, 1, 15, 30),
    teacherId: 'teacher1',
    teacherName: '张老师',
    type: 'lesson',
    description: '力学原理'
  },
];

// 不可用时段数据
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

// 事件样式配置 - 手机端优化
const eventStyleGetter = (event: ScheduleEvent) => {
  let backgroundColor = 'rgba(49, 116, 173, 0.8)';
  let borderColor = '#3174ad';
  
  switch (event.type) {
    case 'lesson':
      backgroundColor = 'rgba(59, 130, 246, 0.8)';
      borderColor = '#2563eb';
      break;
    case 'unavailable':
      backgroundColor = 'rgba(107, 114, 128, 0.8)';
      borderColor = '#4b5563';
      break;
    case 'selected':
      backgroundColor = 'rgba(216, 27, 96, 0.8)';
      borderColor = 'rgb(216, 27, 96)';
      break;
  }

  return {
    style: {
      backgroundColor,
      borderColor,
      color: 'white',
      border: `1px solid ${borderColor}`,
      borderRadius: event.type === 'selected' ? '6px' : '4px',
      fontSize: '11px', // 手机端稍小的字体
      boxShadow: event.type === 'selected' ? '0 0 10px 0 rgba(0, 0, 0, 0.2)' : 'none',
      zIndex: event.type === 'selected' ? 15 : 1,
      minHeight: '20px' // 确保在手机端有足够的触摸目标
    }
  };
};

export default function MobileSchedulePage() {
  const [events, setEvents] = useState<ScheduleEvent[]>(mockEvents);
  const [date, setDate] = useState(new Date()); // 默认显示当天
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isClosingModal, setIsClosingModal] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<{ start: Date; end: Date } | null>(null);

  // 清除选中状态
  const clearSelectedState = useCallback(() => {
    setSelectedTimeRange(null);
  }, []);

  // 处理点击外部区域取消选择 - 手机端优化（使用标准事件）
  const handleClickOutside = useCallback((e: Event) => {
    const target = e.target as Node;
    
    // 检查是否点击在日历内部
    if (calendarRef.current && calendarRef.current.contains(target)) {
      return;
    }
    
    // 检查是否点击在模态框内部
    if (target instanceof Element) {
      const modalElement = target.closest('[data-modal="mobile-add-event"]');
      if (modalElement) {
        return;
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
    // 使用标准的click事件，兼容移动端和桌面端
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [handleClickOutside]);

  // 检查时间段是否与不可用时间段重合
  const checkTimeConflict = useCallback((start: Date, end: Date) => {
    const conflictingSlots = unavailableTimeSlots.filter(slot => {
      const sameDay = moment(start).isSame(moment(slot.start), 'day');
      if (!sameDay) return false;
      
      const startTime = moment(start);
      const endTime = moment(end);
      const slotStart = moment(slot.start);
      const slotEnd = moment(slot.end);
      
      return startTime.isBefore(slotEnd) && endTime.isAfter(slotStart);
    });
    
    return conflictingSlots;
  }, []);

  // 处理时间段选择 - 手机端优化
  const handleSelectSlot = useCallback(({ start, end }: { start: Date; end?: Date }) => {
    console.log('🎯 handleSelectSlot 被调用了！', { start, end });
    
    clearSelectedState();
    if (showAddModal) {
      setShowAddModal(false);
      setIsClosingModal(false);
    }
    
    setSelectedDate(start);
    
    const actualEnd = end || new Date(start.getTime() + 30 * 60 * 1000);
    setSelectedTimeRange({ start, end: actualEnd });
    
    console.log('✅ 设置时间范围:', { start, end: actualEnd });
    
    // 手机端直接显示模态框，不需要复杂的位置计算
    setIsClosingModal(false);
    setShowAddModal(true);
    
    console.log('🔥 显示模态框');
  }, [clearSelectedState, showAddModal]);

  // 处理事件选择 - 手机端优化
  const handleSelectEvent = useCallback((event: ScheduleEvent) => {
    if (event.type === 'selected') {
      return;
    }
    
    // 手机端使用简单的alert，或者可以后续改为底部弹出的详情页
    alert(`${event.title}\n${moment(event.start).format('HH:mm')} - ${moment(event.end).format('HH:mm')}\n${event.description || '无描述'}`);
  }, []);

  // 添加新事件
  const handleAddEvent = useCallback((newEvent: Partial<ScheduleEvent>) => {
    const event: ScheduleEvent = {
      ...newEvent as ScheduleEvent,
      id: Date.now().toString()
    };
    setEvents(prev => [...prev, event]);
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
      clearSelectedState();
    }
  }, [isClosingModal, clearSelectedState]);

  // 合并真实事件和虚拟选中事件
  const allEvents = useMemo(() => {
    const eventsWithSelection = [...events];
    
    if (selectedTimeRange) {
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
    
    return eventsWithSelection;
  }, [events, selectedTimeRange]);

  // 导航函数 - 只支持日视图
  const navigate = useCallback((action: 'PREV' | 'NEXT' | 'TODAY') => {
    let newDate = new Date(date);
    
    switch (action) {
      case 'PREV':
        newDate.setDate(date.getDate() - 1);
        break;
      case 'NEXT':
        newDate.setDate(date.getDate() + 1);
        break;
      case 'TODAY':
        newDate = new Date();
        break;
    }
    
    setDate(newDate);
  }, [date]);

  // 格式化日期标题 - 手机端简化
  const getDateTitle = useCallback(() => {
    return moment(date).format('MM月DD日 dddd');
  }, [date]);

  // 创建自定义时间槽包装器 - 添加直接点击处理
  const CustomTimeSlotWrapper = useCallback((props: any) => {
    const { children, value } = props;
    const slotTime = moment(value);
    
    const isUnavailable = unavailableTimeSlots.some(unavailableSlot => {
      const startTime = moment(unavailableSlot.start);
      const endTime = moment(unavailableSlot.end);
      
      const matches = slotTime.isSame(startTime, 'day') && 
                     slotTime.isBetween(startTime, endTime, 'minute', '[)');
      
      return matches;
    });
    
    // 直接在时间槽上添加点击处理器作为备选方案
    const handleDirectClick = (e: React.MouseEvent) => {
      console.log('🔥 直接点击时间槽:', value);
      e.preventDefault();
      e.stopPropagation();
      
      // 手动触发选择逻辑
      const start = new Date(value);
      const end = new Date(start.getTime() + 30 * 60 * 1000);
      handleSelectSlot({ start, end });
    };

    const handleDirectTouch = (e: React.TouchEvent) => {
      console.log('📱 直接触摸时间槽:', value);
      e.preventDefault();
      e.stopPropagation();
      
      // 手动触发选择逻辑
      const start = new Date(value);
      const end = new Date(start.getTime() + 30 * 60 * 1000);
      handleSelectSlot({ start, end });
    };
    
    if (isUnavailable) {
      return (
        <div className="unavailable-time-slot">
          {children}
        </div>
      );
    }
    
    return (
      <div 
        onClick={handleDirectClick}
        onTouchEnd={handleDirectTouch}
        style={{ 
          width: '100%', 
          height: '100%',
          cursor: 'pointer',
          position: 'relative'
        }}
      >
        {children}
      </div>
    );
  }, [unavailableTimeSlots, handleSelectSlot]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* 手机端头部 - 更紧凑 */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 sticky top-0 z-40 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-6 w-6 text-blue-500" />
            <h1 className="text-lg font-bold text-gray-900">日程安排</h1>
          </div>
          
          {/* 添加课程按钮 */}
          <button
            onClick={() => {
              clearSelectedState();
              if (showAddModal) {
                setShowAddModal(false);
                setIsClosingModal(false);
              }
              
              setSelectedDate(new Date());
              setIsClosingModal(false);
              setShowAddModal(true);
            }}
            className="flex items-center space-x-1 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm active:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4" />
            <span>添加</span>
          </button>
        </div>

        {/* 日期导航 */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('PREV')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors active:bg-gray-200"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          
          <div className="flex flex-col items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {getDateTitle()}
            </h2>
            <button
              onClick={() => navigate('TODAY')}
              className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors active:bg-blue-100"
            >
              今天
            </button>
          </div>
          
          <button
            onClick={() => navigate('NEXT')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors active:bg-gray-200"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>

        {/* 图例 - 手机端简化 */}
        <div className="flex items-center justify-center gap-4 mt-3 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded"></div>
            <span className="text-gray-600">课程</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-gray-500 rounded"></div>
            <span className="text-gray-600">不可用</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-gray-300 rounded"></div>
            <span className="text-gray-600">不可用时段</span>
          </div>
        </div>
      </div>

      {/* 日历主体 - 手机端优化 */}
      <div className="flex-1 pt-2">
        <div 
          ref={calendarRef} 
          className="bg-white shadow-sm border border-gray-200 h-full"
        >
          <Calendar
            localizer={localizer}
            events={allEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ 
              padding: '10px',
              height: 'calc(100vh - 200px)', // 适配手机屏幕
              fontSize: '12px', // 手机端较小的字体
              touchAction: 'manipulation' // 手机端触摸优化
            }}
            view={Views.DAY} // 只使用日视图
            onView={() => {}} // 禁用视图切换
            date={date}
            onNavigate={setDate}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            selectable={true} // 强制启用选择
            eventPropGetter={eventStyleGetter}
            toolbar={false} // 隐藏默认工具栏
            min={new Date(2025, 0, 1, 9, 0, 0)}
            max={new Date(2025, 0, 1, 22, 0, 0)}
            step={15}
            timeslots={2}
            showMultiDayTimes={false}
            popup={false}
            popupOffset={0}
            drilldownView={null} // 禁用钻取，避免移动端冲突
            components={{
              timeSlotWrapper: CustomTimeSlotWrapper,
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
              dayHeaderFormat: 'MM月DD日 dddd'
            }}
          />
        </div>
      </div>

      {/* 手机端添加事件模态框 */}
      <MobileAddEventModal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        onSave={handleAddEvent}
        selectedDate={selectedDate}
        selectedTimeRange={selectedTimeRange || undefined}
        onAnimationComplete={handleAnimationComplete}
        onConflictCheck={checkTimeConflict}
      />
    </div>
  );
} 