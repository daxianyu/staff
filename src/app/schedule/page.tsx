'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './schedule.css';
import { PlusIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import AddEventModal from './components/AddEventModal';

// 设置中文
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
  type: 'lesson' | 'available' | 'unavailable' | 'selected';
  description?: string;
}

// 模拟课程数据
const mockEvents: ScheduleEvent[] = [
  {
    id: '1',
    title: '高三数学',
    start: new Date(2025, 5, 25, 9, 0),
    end: new Date(2025, 5, 25, 10, 30),
    teacherId: 'teacher1',
    teacherName: '张老师',
    type: 'lesson',
    description: '微积分基础'
  },
  {
    id: '2',
    title: '高二物理',
    start: new Date(2025, 5, 26, 14, 0),
    end: new Date(2025, 5, 26, 15, 30),
    teacherId: 'teacher1',
    teacherName: '张老师',
    type: 'lesson',
    description: '力学原理'
  },
  {
    id: '3',
    title: '已确认可用时段',
    start: new Date(2025, 5, 27, 8, 0),
    end: new Date(2025, 5, 27, 12, 0),
    teacherId: 'teacher1',
    teacherName: '张老师',
    type: 'available',
    description: '周二上午可安排课程'
  },
  {
    id: '4',
    title: '教师会议',
    start: new Date(2025, 5, 28, 15, 0),
    end: new Date(2025, 5, 28, 17, 0),
    teacherId: 'teacher1',
    teacherName: '张老师',
    type: 'unavailable',
    description: '全体教师大会'
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
    case 'available':
      backgroundColor = 'rgba(16, 185, 129, 0.8)'; // 绿色 + 透明度 (confirmed available)
      borderColor = '#059669';
      break;
    case 'unavailable':
      backgroundColor = 'rgba(107, 114, 128, 0.8)'; // 灰色 + 透明度
      borderColor = '#4b5563';
      break;
    case 'selected':
      backgroundColor = 'rgba(216, 27, 96, 0.8)'; // 选中色 + 透明度
      borderColor = 'rgb(216, 27, 96)';
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

export default function SchedulePage() {
  const [events, setEvents] = useState<ScheduleEvent[]>(mockEvents);
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [modalPosition, setModalPosition] = useState<{ x: number; y: number; slideDirection?: 'left' | 'right' | 'center' }>();
  const [isClosingModal, setIsClosingModal] = useState(false);
  const [lastMousePosition, setLastMousePosition] = useState<{ x: number; y: number; target?: EventTarget | null }>();
  const calendarRef = useRef<HTMLDivElement>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<{ start: Date; end: Date } | null>(null);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (calendarRef.current && calendarRef.current.contains(e.target as Node)) {
      setLastMousePosition({ 
        x: e.clientX, 
        y: e.clientY, 
        target: e.target 
      });
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [handleMouseDown]);


  // 清除选中状态
  const clearSelectedState = useCallback(() => {
    setSelectedTimeRange(null);
    console.log('清除了选中状态');
  }, []);

  // 处理时间范围变化
  const handleTimeRangeChange = useCallback((newTimeRange: { start: Date; end: Date }) => {
    console.log('📈 SchedulePage 接收到时间范围变化:', newTimeRange);
    setSelectedTimeRange(newTimeRange);
    console.log('✅ SchedulePage 已更新 selectedTimeRange');
  }, []);

  // 基于时间计算在日历中的位置（简化版本）
  const calculatePositionFromTime = useCallback((startTime: Date, endTime: Date) => {
    console.log('尝试基于时间计算位置，将通过useEffect异步更新');
    return null; // 位置会通过useEffect异步更新
  }, []);

  // 处理时间段选择
  const handleSelectSlot = useCallback(({ start, end, box }: { start: Date; end?: Date; box?: { x: number; y: number; clientX: number; clientY: number } }) => {
    clearSelectedState();
    if (showAddModal) {
      setShowAddModal(false);
      setIsClosingModal(false);
    }
    
    setSelectedDate(start);
    console.log('=== 时间段选择事件 ===');
    console.log('时间范围:', { start, end });
    console.log('box参数:', box);
    console.log('lastMousePosition:', lastMousePosition);
    
    // 保存选中的时间范围，用于创建虚拟选中事件
    const actualEnd = end || new Date(start.getTime() + 30 * 60 * 1000); // 默认30分钟
    setSelectedTimeRange({ start, end: actualEnd });
    console.log('保存选中时间范围:', { start, end: actualEnd });
    // 计算模态框位置，优先使用box坐标，然后是鼠标位置，最后基于时间计算位置
    let modalX = 0;
    let modalY = 0;
    
    if (box && (box.clientX || box.x)) {
      // 使用box提供的坐标
      modalX = box.clientX || box.x;
      modalY = box.clientY || box.y;
      console.log('使用box坐标:', { x: modalX, y: modalY });
    } else if (lastMousePosition) {
      // 使用记录的鼠标位置
      modalX = lastMousePosition.x;
      modalY = lastMousePosition.y;
      console.log('使用鼠标位置:', { x: modalX, y: modalY });
      
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
          
          console.log('🚀 即时位置计算:');
          console.log('屏幕宽度:', screenWidth);
          console.log('时间槽位置:', { left: slotRect.left, right: slotRect.right });
          console.log('可用空间:', { left: leftSpace, right: rightSpace });
          
          let slideDirection: 'left' | 'right' | 'center';
          if (rightSpace >= modalWidth + 30) {
            modalX = slotRect.right + 20;
            modalY = slotRect.top;
            slideDirection = 'right';
            console.log('✅ 即时选择右侧');
          } else if (leftSpace >= modalWidth + 30) {
            modalX = slotRect.left - modalWidth - 20;
            modalY = slotRect.top;
            slideDirection = 'left';
            console.log('✅ 即时选择左侧');
          } else {
            modalX = Math.max(10, Math.min(slotRect.left + (slotRect.width - modalWidth) / 2, screenWidth - modalWidth - 10));
            modalY = slotRect.bottom + 10;
            slideDirection = 'center';
            console.log('✅ 即时选择下方');
          }
          
          // 直接设置带有滑动方向的位置
          setModalPosition({ x: modalX, y: modalY, slideDirection });
          setIsClosingModal(false);
          setShowAddModal(true);
          console.log('使用即时计算位置:', { x: modalX, y: modalY, slideDirection });
          return; // 提前返回，不执行后续逻辑
                 } else {
            modalX = rect.right + 10;
            modalY = rect.top;
          console.log('使用时间槽位置:', { x: modalX, y: modalY });
        }
      }
         } else {
       // 最后的fallback：使用屏幕中心，然后异步查找虚拟事件位置
       modalX = window.innerWidth / 2;
       modalY = window.innerHeight / 2;
       console.log('使用屏幕中心位置:', { x: modalX, y: modalY });
       
       // 尝试异步查找虚拟事件的位置
       calculatePositionFromTime(start, actualEnd);
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
    
    alert(`选择了事件: ${event.title}\n时间: ${moment(event.start).format('YYYY-MM-DD HH:mm')} - ${moment(event.end).format('HH:mm')}\n描述: ${event.description || '无'}`);
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

  // 导航函数
  const navigate = useCallback((action: 'PREV' | 'NEXT' | 'TODAY') => {
    let newDate = new Date(date);
    
    switch (action) {
      case 'PREV':
        if (view === Views.MONTH) {
          newDate.setMonth(date.getMonth() - 1);
        } else if (view === Views.WEEK) {
          newDate.setDate(date.getDate() - 7);
        } else if (view === Views.DAY) {
          newDate.setDate(date.getDate() - 1);
        }
        break;
      case 'NEXT':
        if (view === Views.MONTH) {
          newDate.setMonth(date.getMonth() + 1);
        } else if (view === Views.WEEK) {
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
  }, [date, view]);

  // 格式化日期标题
  const getDateTitle = useCallback(() => {
    if (view === Views.MONTH) {
      return moment(date).format('YYYY年MM月');
    } else if (view === Views.WEEK) {
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

  // 监听虚拟事件的渲染，自动调整模态框位置
  useEffect(() => {
    if (selectedTimeRange && showAddModal) {
      console.log('🔍 开始查找虚拟事件...');
      // 多次尝试查找虚拟事件并调整位置
      const attempts = [50, 150, 300, 500];
      
      attempts.forEach(delay => {
        setTimeout(() => {
          if (calendarRef.current && showAddModal) {
            console.log(`⏱️ 尝试查找虚拟事件 (${delay}ms)`);
            const selectedEvent = calendarRef.current.querySelector('[title="选中时间段"]') as HTMLElement;
            console.log('找到的虚拟事件:', selectedEvent);
            if (selectedEvent) {
              const rect = selectedEvent.getBoundingClientRect();
              const screenWidth = window.innerWidth;
              const modalWidth = 384; // w-96 = 384px
              
              // 计算最佳位置（左侧或右侧）
              const leftSpace = rect.left;
              const rightSpace = screenWidth - rect.right;
              const requiredSpace = modalWidth + 30; // 模态框宽度 + 30px间距
              
              console.log('===== 位置计算调试 =====');
              console.log('屏幕宽度:', screenWidth);
              console.log('选中区域:', { left: rect.left, right: rect.right, width: rect.width });
              console.log('可用空间:', { left: leftSpace, right: rightSpace });
              console.log('需要空间:', requiredSpace);
              
              let x, y, slideDirection: 'left' | 'right' | 'center';
              
              if (rightSpace >= requiredSpace) {
                // 右侧空间足够：从选中区域右边缘开始，向右偏移20px
                x = rect.right + 20;
                y = rect.top;
                slideDirection = 'right';
                console.log('✅ 选择右侧放置');
              } else if (leftSpace >= requiredSpace) {
                // 左侧空间足够：模态框右边缘距离选中区域左边缘20px
                x = rect.left - modalWidth - 20;
                y = rect.top;
                slideDirection = 'left';
                console.log('✅ 选择左侧放置');
              } else {
                // 空间不够，放在下方中心位置
                x = Math.max(10, Math.min(rect.left + (rect.width - modalWidth) / 2, screenWidth - modalWidth - 10));
                y = rect.bottom + 10;
                slideDirection = 'center';
                console.log('✅ 选择下方放置');
              }
              
              console.log('最终位置:', { x, y, slideDirection });
              console.log('=========================');
              
              setModalPosition({ x, y, slideDirection });
              console.log(`虚拟事件位置更新 (${delay}ms):`, { 
                x, y, 
                eventRect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
                spaces: { left: leftSpace, right: rightSpace },
                modalWidth
              });
            }
          }
        }, delay);
      });
    }
  }, [selectedTimeRange, showAddModal]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-auto">
      {/* 头部导航 */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-3 sm:px-6 py-4 sticky top-0 z-40 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">教师排课系统</h1>
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
              <button
                onClick={() => setView(Views.MONTH)}
                className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition-colors ${
                  view === Views.MONTH
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                月
              </button>
            </div>

            {/* 添加课程按钮 */}
            <button
              onClick={(e) => {
                // 🔥 首先清除上一次的选中状态和模态框
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
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600 whitespace-nowrap">确认可用</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white border border-gray-300 rounded"></div>
            <span className="text-gray-600 whitespace-nowrap">可用时段</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-500 rounded"></div>
            <span className="text-gray-600 whitespace-nowrap">不可用</span>
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
        onTimeRangeChange={handleTimeRangeChange}
      />
    </div>
  );
} 