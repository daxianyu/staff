'use client';

import { useState, useCallback, useMemo } from 'react';
import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { PlusIcon, CalendarIcon } from '@heroicons/react/24/outline';
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
  type: 'course' | 'available' | 'unavailable';
  description?: string;
}

// 模拟课程数据
const mockEvents: ScheduleEvent[] = [
  {
    id: '1',
    title: '高三数学',
    start: new Date(2025, 0, 20, 9, 0),
    end: new Date(2025, 0, 20, 10, 30),
    teacherId: 'teacher1',
    teacherName: '张老师',
    type: 'course',
    description: '微积分基础'
  },
  {
    id: '2',
    title: '高二物理',
    start: new Date(2025, 0, 20, 14, 0),
    end: new Date(2025, 0, 20, 15, 30),
    teacherId: 'teacher1',
    teacherName: '张老师',
    type: 'course',
    description: '力学原理'
  },
  {
    id: '3',
    title: '可用时段',
    start: new Date(2025, 0, 21, 8, 0),
    end: new Date(2025, 0, 21, 12, 0),
    teacherId: 'teacher1',
    teacherName: '张老师',
    type: 'available',
    description: '周二上午可安排课程'
  },
  {
    id: '4',
    title: '教师会议',
    start: new Date(2025, 0, 22, 15, 0),
    end: new Date(2025, 0, 22, 17, 0),
    teacherId: 'teacher1',
    teacherName: '张老师',
    type: 'unavailable',
    description: '全体教师大会'
  }
];

// 事件样式配置
const eventStyleGetter = (event: ScheduleEvent) => {
  let backgroundColor = '#3174ad';
  let borderColor = '#3174ad';
  
  switch (event.type) {
    case 'course':
      backgroundColor = '#10b981';
      borderColor = '#059669';
      break;
    case 'available':
      backgroundColor = '#22c55e';
      borderColor = '#16a34a';
      break;
    case 'unavailable':
      backgroundColor = '#ef4444';
      borderColor = '#dc2626';
      break;
  }

  return {
    style: {
      backgroundColor,
      borderColor,
      color: 'white',
      border: `1px solid ${borderColor}`,
      borderRadius: '4px',
      fontSize: '12px'
    }
  };
};

export default function SchedulePage() {
  const [events, setEvents] = useState<ScheduleEvent[]>(mockEvents);
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();

  // 处理时间段选择
  const handleSelectSlot = useCallback(({ start }: { start: Date }) => {
    setSelectedDate(start);
    setShowAddModal(true);
  }, []);

  // 处理事件选择
  const handleSelectEvent = useCallback((event: ScheduleEvent) => {
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

  return (
    <div className="h-screen flex flex-col">
      {/* 头部导航 */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <CalendarIcon className="h-8 w-8 text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-900">教师排课系统</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* 视图切换 */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView(Views.DAY)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  view === Views.DAY
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                日视图
              </button>
              <button
                onClick={() => setView(Views.WEEK)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  view === Views.WEEK
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                周视图
              </button>
              <button
                onClick={() => setView(Views.MONTH)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  view === Views.MONTH
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                月视图
              </button>
            </div>

            {/* 添加课程按钮 */}
            <button
              onClick={() => {
                setSelectedDate(new Date());
                setShowAddModal(true);
              }}
              className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              <span>添加课程</span>
            </button>
          </div>
        </div>

        {/* 图例 */}
        <div className="flex items-center space-x-6 mt-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600">课程安排</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded"></div>
            <span className="text-gray-600">可用时段</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-600">不可用时段</span>
          </div>
        </div>
      </div>
      {/* 日历主体 */}
      <div className="flex-1 pt-6">
        <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            
            endAccessor="end"
            style={{ height: '100%', padding: '20px' }}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            selectable
            eventPropGetter={eventStyleGetter}
            min={new Date(2025, 0, 1, 6, 0, 0)} // 早上6点开始
            max={new Date(2025, 0, 1, 22, 0, 0)} // 晚上10点结束
            step={30} // 30分钟间隔
            timeslots={2} // 每小时2个时间槽
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
        onClose={() => setShowAddModal(false)}
        onSave={handleAddEvent}
        selectedDate={selectedDate}
      />
    </div>
  );
} 