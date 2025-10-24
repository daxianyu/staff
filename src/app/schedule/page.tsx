'use client';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/zh-cn';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './schedule.css';
import { PlusIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import AddEventModal from './components/AddEventModal';
import { getStaffSchedule, getStaffInfo, type StaffInfo } from '@/services/auth';
import { useSearchParams } from 'next/navigation';
import { addStaffLesson, editStaffLesson, deleteStaffLesson, updateStaffUnavailable,
  addStaffInvigilate, updateStaffInvigilate, deleteStaffInvigilate,
  type UnavailableEventAPI, type AddLessonParams, type EditLessonParams, type DeleteLessonParams 
} from '@/services/auth';

// 设置中文
moment.locale('zh-cn');
const localizer = momentLocalizer(moment);

// 模拟数据类型
interface ScheduleEvent {
  id: string;
  title: string; // 添加title字段
  start: Date;
  end: Date;
  // teacherId: string;
  teacher: string;
  type: 'lesson' | 'unavailable' | 'selected' | 'selectedRepeat' | 'invigilate';
  description?: string;
  // 课程相关字段
  subject_id?: number;
  room_id?: number;
  class_id?: number;
  students?: string;
  student_ids?: number[];
  room_name?: string;
  student_name?: string;
  // 监考相关字段
  topic_id?: string;
  note?: string;
}

// 时间槽包装器的属性类型
interface TimeSlotWrapperProps {
  children: React.ReactNode;
  value: Date;
}

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
    case 'invigilate':
      backgroundColor = 'rgba(34, 197, 94, 0.8)'; // 绿色 + 透明度
      borderColor = '#16a34a';
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
  invigilate: any[];
  class_topics: Record<string, string>;
}

type SelectedRange = { start: Date; end: Date; repeat?: 'none' | 'weekly' };

export default function SchedulePage() {
  const searchParams = useSearchParams();
  const urlStaffId = searchParams.get('staffId');
  
  // 如果没有传递staffId，从localStorage获取当前用户ID
  const getCurrentStaffId = () => {
    if (urlStaffId) return urlStaffId;
    
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id?.toString() || '';
      }
    } catch (error) {
      console.error('解析用户信息失败:', error);
    }
    return '';
  };
  
  const staffId = getCurrentStaffId();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date()); // 默认显示当天
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [modalPosition, setModalPosition] = useState<{ x: number; y: number; slideDirection?: 'left' | 'right' | 'center' }>();
  const [isClosingModal, setIsClosingModal] = useState(false);
  const [lastMousePosition, setLastMousePosition] = useState<{ x: number; y: number; target?: EventTarget | null }>();
  const calendarRef = useRef<HTMLDivElement>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<SelectedRange | null>(null);
  const [unavailableTimeRanges, setUnavailableTimeRanges] = useState<SelectedRange[]>([]);

  // 新增：保存完整课表数据
  const [scheduleData, setScheduleData] = useState<StaffScheduleData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 新增：编辑事件状态
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false); // 新增：是否处于只读模式
  


  // 新增：用户信息状态
  const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null);
  const [staffInfoLoading, setStaffInfoLoading] = useState(false);

  // 获取用户信息
  const fetchStaffInfo = useCallback(async () => {
    if (!staffId) return;
    
    try {
      setStaffInfoLoading(true);
      const response = await getStaffInfo(staffId);
      if (response.code === 200 && response.data) {
        setStaffInfo(response.data);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    } finally {
      setStaffInfoLoading(false);
    }
  }, [staffId]);

  // 合并重叠的时间段
  const mergeOverlappingTimeRanges = useCallback((timeRanges: Array<{ start: Date; end: Date }>) => {
    if (timeRanges.length <= 1) return timeRanges;
    
    // 按开始时间排序
    const sorted = [...timeRanges].sort((a, b) => a.start.getTime() - b.start.getTime());
    const merged: Array<{ start: Date; end: Date }> = [];
    
    let current = sorted[0];
    
    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i];
      
      // 检查是否有重叠
      if (current.end >= next.start) {
        // 有重叠，合并时间段
        current = {
          start: current.start,
          end: new Date(Math.max(current.end.getTime(), next.end.getTime()))
        };
      } else {
        // 没有重叠，保存当前时间段，开始新的时间段
        merged.push(current);
        current = next;
      }
    }
    
    // 添加最后一个时间段
    merged.push(current);
    
    return merged;
  }, []);

  // 统一处理课表数据的函数
  const handleScheduleData = useCallback((resp: any) => {
    if (resp && resp.data) {
      setScheduleData(resp.data);
      const allEvents: ScheduleEvent[] = [];
      
      // 处理课程数据
      if (Array.isArray(resp.data.lessons)) {
        const lessonEvents = resp.data.lessons.map((lesson: any) => ({
          id: String(lesson.lesson_id) || String(Math.random()),
          title: lesson.subject_name || '课程',
          start: new Date(lesson.start_time * 1000),
          end: new Date(lesson.end_time * 1000),
          // teacherId: lesson.teacherId || staffId,
          teacher: lesson.teacher || '',
          type: 'lesson' as const,
          // 保存完整的课程信息用于编辑
          subject_id: lesson.subject_id,
          room_id: lesson.room_id,
          class_id: lesson.class_id,
          students: lesson.students,
          student_ids: lesson.student_ids,
          room_name: lesson.room_name || '',
          student_name: lesson.student_name || ''
        }));
        allEvents.push(...lessonEvents);
      }
      
      // 处理监考数据
      if (Array.isArray(resp.data.invigilate)) {
        const invigilateEvents = resp.data.invigilate.map((invigilate: any) => {
          const subjectName = resp.data.class_topics?.[invigilate.topic_id] || '未知科目';
          const teacher = staffInfo?.staff_name || '';
          const note = invigilate.note || '';
          
          let title = '';
          if (teacher && note) {
            title = `<p>监考: ${subjectName}</p><p>教师: ${teacher}</p><p>备注: ${note}</p>`;
          } else if (teacher) {
            title = `<p>监考: ${subjectName}</p><p>教师: ${teacher}</p>`;
          } else if (note) {
            title = `<p>监考: ${subjectName}</p><p>备注: ${note}</p>`;
          } else {
            title = `<p>监考: ${subjectName}</p>`;
          }
          
          return {
            id: `invigilate_${invigilate.id || String(Math.random())}`,
            title,
            start: new Date(invigilate.start_time * 1000),
            end: new Date(invigilate.end_time * 1000),
            type: 'invigilate' as const,
            topic_id: invigilate.topic_id || '', // 保存topic_id用于编辑
            note: invigilate.note || '', // 保存note用于编辑
            teacher: teacher // 保存teacher用于编辑
          };
        });
        allEvents.push(...invigilateEvents);
      }
      
      setEvents(allEvents);
      
      if (Array.isArray(resp.data.unavailable)) {
        // 转换时间段并合并重叠的时间段
        const timeRanges = resp.data.unavailable.map((unavailable: any) => ({
          start: new Date(unavailable.start_time * 1000),
          end: new Date(unavailable.end_time * 1000)
        }));
        
        const mergedTimeRanges = mergeOverlappingTimeRanges(timeRanges);
        setUnavailableTimeRanges(mergedTimeRanges);
      }
    } else {
      setScheduleData(null);
      setEvents([]);
    }
  }, [staffId, staffInfo, mergeOverlappingTimeRanges]);

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

      const timePicker = target.closest('.staff-time-picker-content');
      if (timePicker) {
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
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [handleMouseDown, handleClickOutside]);

  // 检查时间段是否与不可用时间段重合
  const checkTimeConflict = useCallback((start: Date, end: Date) => {
    const conflictingSlots = unavailableTimeRanges.filter(slot => {
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
  }, [unavailableTimeRanges]);

  const checkAllEventConflict = useCallback((start: Date, end: Date) => {
    return events.filter(ev =>
      ['lesson', 'invigilate'].includes(ev.type) &&
      start < ev.end && end > ev.start
    );
  }, [events]);

  // 处理时间段选择 - 只允许添加不可用时间段和监考
  const handleSelectSlot = useCallback(({ start, end, box }: { start: Date; end?: Date; box?: { x: number; y: number; clientX: number; clientY: number } }) => {
    clearSelectedState();
    if (showAddModal) {
      setShowAddModal(false);
      setIsClosingModal(false);
    }
    setShowEditModal(false); // 互斥：关闭编辑弹框
    
    setSelectedDate(start);
    
    // 保存选中的时间范围，用于创建虚拟选中事件
    const actualEnd = end || new Date(start.getTime() + 30 * 60 * 1000); // 默认30分钟

    // 新增：选区后立即检测重叠
    const conflicts = checkAllEventConflict(start, actualEnd);
    if (conflicts.length > 0) {
      alert('所选时间段与已有课程、监考或不可用时间重叠！');
      return;
    }

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
  }, [lastMousePosition, clearSelectedState, showAddModal, checkAllEventConflict]);

  // 处理事件选择
  const handleSelectEvent = useCallback((event: ScheduleEvent) => {
    if (event.type === 'selected') return;
    setShowAddModal(false); // 互斥：关闭新增/删除弹框
    setSelectedTimeRange(null); // 清除虚拟选区
    
    if (event.type === 'lesson') {
      // 课程显示详情（只读模式）
      setEditingEvent(event);
      setIsReadOnlyMode(true);
      setShowEditModal(true);
    } else {
      // 其他类型直接进入编辑
      setEditingEvent(event);
      setIsReadOnlyMode(false);
      setShowEditModal(true);
    }
  }, []);

  // 刷新课表数据的函数（提前声明）
  const refreshScheduleData = useCallback(async () => {
    if (!staffId || view !== Views.WEEK) return;
    const weekNum = getWeekNum(date);
    const resp = await getStaffSchedule(staffId, String(weekNum));
    handleScheduleData(resp);
  }, [staffId, date, view, handleScheduleData]); // 添加 handleScheduleData 依赖

  // 添加新事件（异步，负责接口调用）- 只允许添加不可用时间段和监考
  const handleAddEvent = useCallback(async (newEvent: Partial<ScheduleEvent> & {
    repeat?: 'none' | 'weekly';
    subject?: string;
    campus?: string;
    pickRoom?: string;
    replaceRoomWhenBooked?: boolean;
    topic_id?: string;
    note?: string;
    repeat_num?: number;
  }) => {
    setIsSaving(true);
    try {
      const { type, repeat, start, end, topic_id, note, repeat_num } = newEvent;
      
      if (type === 'invigilate') {
        // 添加监考
        const invigilateParams = {
          staff_id: staffId,
          start_time: start ? Math.floor(start.getTime() / 1000) : 0,
          end_time: end ? Math.floor(end.getTime() / 1000) : 0,
          topic_id: topic_id || '',
          note: note || ''
        };
        
        const response = await addStaffInvigilate(invigilateParams);
        
        if (response.status === 0) {
          await refreshScheduleData();
          setShowAddModal(false);
          setIsClosingModal(false);
          setSelectedTimeRange(null);
        } else {
          alert(`保存失败: ${response.message}`);
        }
      } else {
        // 不可用事件 - 前端计算差值，全量更新
        const startTime = start ? start.getTime() : 0;
        const endTime = end ? end.getTime() : 0;
        let newTimeList: Array<{ start_time: number; end_time: number }> = [];
        
        if (repeat === 'weekly' && start && end) {
          // 周内重复：生成从当前日期开始到本周周五的所有工作日时间段
          const startMoment = moment(start);
          const [startHour, startMin] = [start.getHours(), start.getMinutes()];
          const [endHour, endMin] = [end.getHours(), end.getMinutes()];
          for (let d = startMoment.clone(); d.day() <= 5; d.add(1, 'day')) {
            if (d.day() === 0 || d.day() === 6) continue;
            const dayStart = d.clone().hour(startHour).minute(startMin).toDate();
            const dayEnd = d.clone().hour(endHour).minute(endMin).toDate();
            newTimeList.push({
              start_time: dayStart.getTime(),
              end_time: dayEnd.getTime()
            });
          }
        } else {
          // 不重复：只添加当前时间段
          newTimeList.push({
            start_time: startTime,
            end_time: endTime
          });
        }
        
        // 合并现有的不可用时间段
        const existingTimeList = unavailableTimeRanges.map(slot => ({
          start_time: slot.start.getTime(),
          end_time: slot.end.getTime()
        }));
        
        // 全量更新：现有时间段 + 新时间段
        const allTimeList = [...existingTimeList, ...newTimeList];
        
        const apiEventData = {
          week_num: getWeekNum(date),
          event_type: 1 as const,
          time_list: allTimeList
        };
        const response = await updateStaffUnavailable(staffId, apiEventData);
        if (response.status === 0) {
          // 刷新数据
          await refreshScheduleData();
          setShowAddModal(false);
          setIsClosingModal(false);
          setSelectedTimeRange(null);
        } else {
          alert(`保存失败: ${response.message}`);
        }
      }
    } catch (error) {
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  }, [staffId, refreshScheduleData, unavailableTimeRanges]);

  // 处理模态框关闭
  const handleCloseModal = useCallback(() => {
    setIsClosingModal(true);
    setShowAddModal(false);
  }, []);

  // 处理编辑事件 - 只能修改room、repeat_num、time
  const handleEditEvent = useCallback(async (formData: any) => {
    setIsSaving(true);
    try {
      if (formData.type === 'lesson') {
        // 编辑课程 - 只能修改room、repeat_num、time
        const params = {
          lesson_id: formData.id,
          subject_id: formData.subject_id || editingEvent?.subject_id || '', // 使用编辑事件的subject_id
          start_time: formData.start ? Math.floor(formData.start.getTime() / 1000) : 0,
          end_time: formData.end ? Math.floor(formData.end.getTime() / 1000) : 0,
          room_id: formData.pickRoom || '',
          repeat_num: formData.repeat_num || 1
        };
        const response = await editStaffLesson(staffId, params);
        if (response.status === 0) {
          await refreshScheduleData();
          setShowEditModal(false);
          setEditingEvent(null);
        } else {
          alert(`保存失败: ${response.message}`);
        }
      } else if (formData.type === 'invigilate') {
        // 编辑监考
        const params = {
          record_id: formData.id.replace('invigilate_', ''),
          staff_id: staffId,
          start_time: formData.start ? Math.floor(formData.start.getTime() / 1000) : 0,
          end_time: formData.end ? Math.floor(formData.end.getTime() / 1000) : 0,
          topic_id: formData.topic_id || '',
          note: formData.note || ''
        };
        const response = await updateStaffInvigilate(params);
        if (response.status === 0) {
          await refreshScheduleData();
          setShowEditModal(false);
          setEditingEvent(null);
        } else {
          alert(`保存失败: ${response.message}`);
        }
      } else if (formData.type === 'unavailable') {
        // 编辑不可用时间段 - 前端计算差值，全量更新
        const newStartTime = formData.start ? moment(formData.start) : moment(editingEvent?.start);
        const newEndTime = formData.end ? moment(formData.end) : moment(editingEvent?.end);
        const originalStartTime = moment(editingEvent?.start);
        const originalEndTime = moment(editingEvent?.end);
        
        // 构建新的不可用时间段列表
        let newTimeList: Array<{ start_time: number; end_time: number }> = [];
        
        if (formData.repeat === 'weekly') {
          // 周内重复：生成从当前日期开始到本周周五的所有工作日时间段
          const startMoment = newStartTime.clone();
          for (let d = startMoment.clone(); d.day() <= 5; d.add(1, 'day')) {
            // 只包含工作日 (Monday=1 .. Friday=5)
            if (d.day() === 0 || d.day() === 6) continue; // 跳过周末
            
            const dayStart = d.clone().hour(newStartTime.hour()).minute(newStartTime.minute()).toDate();
            const dayEnd = d.clone().hour(newEndTime.hour()).minute(newEndTime.minute()).toDate();
            newTimeList.push({
              start_time: dayStart.getTime(),
              end_time: dayEnd.getTime()
            });
          }
        } else {
          // 不重复：只更新当前时间段
          newTimeList.push({
            start_time: newStartTime.toDate().getTime(),
            end_time: newEndTime.toDate().getTime()
          });
        }
        
        // 构建全量更新的时间段列表：现有时间段 - 原时间段 + 新时间段
        const timeList = unavailableTimeRanges
          .filter(slot => {
            const slotStart = moment(slot.start);
            const slotEnd = moment(slot.end);
            
            // 过滤掉与原始时间段相关的时间段（相同的时间点）
            const isRelated = slotStart.hour() === originalStartTime.hour() && 
                             slotStart.minute() === originalStartTime.minute() &&
                             slotEnd.hour() === originalEndTime.hour() && 
                             slotEnd.minute() === originalEndTime.minute();
            
            return !isRelated;
          })
          .map(slot => ({
            start_time: slot.start.getTime(),
            end_time: slot.end.getTime()
          }));
        
        // 全量更新：过滤后的现有时间段 + 新时间段
        const allTimeList = [...timeList, ...newTimeList];
        
        const response = await updateStaffUnavailable(staffId, {
          week_num: getWeekNum(date),
          event_type: 1,
          time_list: allTimeList
        });
        
        if (response.status === 0) {
          await refreshScheduleData();
          setShowEditModal(false);
          setEditingEvent(null);
        } else {
          alert(`保存失败: ${response.message}`);
        }
      }
    } catch (error) {
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  }, [staffId, refreshScheduleData, editingEvent, unavailableTimeRanges]);

  // 处理删除事件 - 支持删除多周
  const handleDeleteEvent = useCallback(async (repeat_num?: number) => {
    if (!editingEvent) return;
    setIsSaving(true);
    try {
      if (editingEvent.type === 'lesson') {
        // 删除课程 - 支持删除多周
        const response = await deleteStaffLesson(staffId, { 
          lesson_ids: [editingEvent.id],
          repeat_num: repeat_num || 1
        });
        if (response.status === 0) {
          await refreshScheduleData();
          setShowEditModal(false);
          setEditingEvent(null);
        } else {
          alert(`删除失败: ${response.message}`);
        }
      } else if (editingEvent.type === 'invigilate') {
        // 删除监考 - 直接删除，不需要重复周数
        const record_id = editingEvent.id.replace('invigilate_', '');
        const response = await deleteStaffInvigilate({ 
          record_id
        });
        if (response.status === 0) {
          await refreshScheduleData();
          setShowEditModal(false);
          setEditingEvent(null);
        } else {
          alert(`删除失败: ${response.message}`);
        }
      } else if (editingEvent.type === 'unavailable') {
        // 删除不可用时间段 - 前端计算差值，全量更新
        const originalStartTime = moment(editingEvent.start);
        const originalEndTime = moment(editingEvent.end);
        
        // 构建全量更新的时间段列表：现有时间段 - 要删除的时间段
        const timeList = unavailableTimeRanges
          .filter(slot => {
            const slotStart = moment(slot.start);
            const slotEnd = moment(slot.end);
            
            // 过滤掉与要删除时间段相关的时间段（相同的时间点）
            const isRelated = slotStart.hour() === originalStartTime.hour() && 
                             slotStart.minute() === originalStartTime.minute() &&
                             slotEnd.hour() === originalEndTime.hour() && 
                             slotEnd.minute() === originalEndTime.minute();
            
            return !isRelated;
          })
          .map(slot => ({
            start_time: slot.start.getTime(),
            end_time: slot.end.getTime()
          }));
        
        const response = await updateStaffUnavailable(staffId, {
          week_num: getWeekNum(date),
          event_type: 1,
          time_list: timeList
        });
        
        if (response.status === 0) {
          await refreshScheduleData();
          setShowEditModal(false);
          setEditingEvent(null);
        } else {
          alert(`删除失败: ${response.message}`);
        }
      }
    } catch (error) {
      alert('删除失败，请重试');
    } finally {
      setIsSaving(false);
    }
  }, [editingEvent, staffId, refreshScheduleData, unavailableTimeRanges]);

  // 新增：删除不可用时间段
  const handleDeleteUnavailable = useCallback(async (conflicts: Array<{ start: Date; end: Date }>) => {
    setIsSaving(true);
    try {
      // 前端计算差值，全量更新：现有时间段 - 冲突时间段
      const time_list = unavailableTimeRanges
        .filter(slot => {
          // 判断两个时间段是否有重叠
          function isOverlap(a: { start: Date; end: Date }, b: { start: Date; end: Date }) {
            return a.start < b.end && a.end > b.start;
          }
          
          // 保留不与任何冲突时间段重叠的时间段
          return !conflicts.some(conf => isOverlap(slot, conf));
        })
        .map(slot => ({
          start_time: slot.start.getTime(),
          end_time: slot.end.getTime()
        }));
      
      const response = await updateStaffUnavailable(staffId, {
        week_num: getWeekNum(date),
        event_type: 1,
        time_list
      });
      if (response.status === 0) {
        await refreshScheduleData();
        setShowAddModal(false);
        setIsClosingModal(false);
        setSelectedTimeRange(null);
      } else {
        alert(`删除失败: ${response.message}`);
      }
    } catch (error) {
      alert('删除失败，请重试');
    } finally {
      setIsSaving(false);
    }
  }, [staffId, refreshScheduleData, unavailableTimeRanges]);

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
            teacher: '系统',
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
          teacher: '系统',
          type: 'selected',
          description: '当前选中的时间段'
        };
        eventsWithSelection.push(selectedEvent);
      }
    }
    
    return eventsWithSelection;
  }, [events, selectedTimeRange]);

  // 获取当前周编号（从1970年1月1日开始的周数，以周一为每周第一天）
  function getWeekNum(date: Date) {
    const start = new Date(1970, 0, 1); // 1970年1月1日
    const diff = date.getTime() - start.getTime();
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    
    // 1970年1月1日是周四，我们需要调整到周一
    // 后端逻辑：减去4天，前端保持一致
    const adjustedDays = days - 4;
    
    // 如果调整后的天数小于0，说明在第一周内
    if (adjustedDays < 0) {
      return 0;
    }
    
    return Math.floor(adjustedDays / 7);
  }

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
  }, [date, view, staffId]); // 移除 handleScheduleData 依赖

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

  // 添加时间变化处理函数
  const handleTimeChange = useCallback((startTime: string, endTime: string) => {
    if (!selectedDate) return;
    
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const newStart = new Date(selectedDate);
    newStart.setHours(startHour, startMin, 0, 0);
    
    const newEnd = new Date(selectedDate);
    newEnd.setHours(endHour, endMin, 0, 0);
    
    // 更新临时事件的时间区间
    setSelectedTimeRange(prev => prev ? {
      ...prev,
      start: newStart,
      end: newEnd
    } : null);
  }, [selectedDate]);

    // 创建自定义时间槽包装器 - 使用React Big Calendar的原生方式
  const CustomTimeSlotWrapper = useCallback((props: any) => {
    const { children, value } = props;
    // value 是当前时间槽的时间（Date对象）
    const slotTime = moment(value);
    
    // 检查这个时间槽是否在任何不可用时间范围内
    const isUnavailable = unavailableTimeRanges.some(unavailableSlot => {
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
  }, [unavailableTimeRanges]);

  // 创建自定义事件组件 - 支持换行显示
  const CustomEvent = useCallback(({ event }: { event: ScheduleEvent }) => {
    return (
      <div className="custom-event">
        {/* 课程标题 */}
        <div className="event-line">
          {event.type === 'invigilate' ? (
            <div dangerouslySetInnerHTML={{ __html: event.title }} />
          ) : (
            event.title
          )}
        </div>
        
        {/* 如果是课程类型，添加教室和学生信息 */}
        {event.type === 'lesson' && (
          <>
            {event.room_name && (
              <div className="event-line">
                教室: {event.room_name}
              </div>
            )}
            {event.teacher && (
              <div className="event-line">
                教师: {event.teacher}
              </div>
            )}
            {event.students && (
              <div className="event-line">
                学生: {event.students && event.students.length > 8
                  ? `${event.students.slice(0, 8)}..等（共${event.student_ids?.length || 0}人）`
                  : event.students}
              </div>
            )}
          </>
        )}
      </div>
    );
  }, []);

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
    if (!staffId || !staffInfo) return; // 确保 staffInfo 已加载
    if (view === Views.WEEK) {
      const weekNum = getWeekNum(date);
      getStaffSchedule(staffId, String(weekNum)).then(handleScheduleData);
    }
  }, [staffId, date, view, staffInfo]); // 添加 staffInfo 依赖

  // 获取用户信息
  useEffect(() => {
    fetchStaffInfo();
  }, [fetchStaffInfo]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-auto">
      {/* 头部导航 */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-3 sm:px-6 py-4 sticky top-0 z-40 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">{staffInfo ? (
                  staffInfo.staff_name + "'s "
              ) + "Schedule":"Schedule"}</h1>
            </div>
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
            <span className="text-gray-600 whitespace-nowrap">监考</span>
          </div>
          {/* <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-500 rounded"></div>
            <span className="text-gray-600 whitespace-nowrap">不可用事件</span>
          </div> */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-300 rounded"></div>
            <span className="text-gray-600 whitespace-nowrap">不可用时段</span>
          </div>
        </div>

        {/* Special Day 显示 */}
        {scheduleData?.special_day && scheduleData.special_day.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium text-blue-800">特殊日期</span>
            </div>
            <div className="space-y-1">
              {scheduleData.special_day.map((day: any, index: number) => (
                <div key={index} className="text-sm text-blue-700">
                  {day.show_day}：{day.desc}
                </div>
              ))}
            </div>
          </div>
        )}
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
            min={new Date(2025, 0, 1, 8, 30, 0)} // 早上8:30开始
            max={new Date(2025, 0, 1, 22, 0, 0)} // 晚上10点结束
            step={15} // 15分钟间隔
            timeslots={2} // 每小时2个时间槽
            showMultiDayTimes={false} // 不显示多日时间
            popup={false} // 不使用弹出窗口
            popupOffset={0} // 弹出偏移量
            components={{
              timeSlotWrapper: CustomTimeSlotWrapper, // 使用自定义时间槽包装器
              event: CustomEvent, // 使用自定义事件组件
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
        onTimeChange={handleTimeChange}
        selectedTimeRange={selectedTimeRange || undefined}
        position={modalPosition}
        onAnimationComplete={handleAnimationComplete}
        onConflictCheck={checkTimeConflict}
        scheduleData={scheduleData}
        // onRefreshData={refreshScheduleData}
        // onRepeatChange={(rep) => setSelectedTimeRange(prev => prev ? { ...prev, repeat: rep } : prev)}
        isSaving={isSaving}
        mode="add"
        onDeleteUnavailable={handleDeleteUnavailable}
      />
      {showEditModal && editingEvent && (
        <AddEventModal
          isOpen={showEditModal}
          onClose={() => { 
            setShowEditModal(false); 
            setEditingEvent(null); 
            setIsReadOnlyMode(false); // 重置只读模式
          }}
          onSave={handleEditEvent}
          onDelete={handleDeleteEvent}
          selectedDate={editingEvent.start}
          onTimeChange={handleTimeChange}
          selectedTimeRange={undefined}
          position={modalPosition}
          onAnimationComplete={handleAnimationComplete}
          onConflictCheck={checkTimeConflict}
          scheduleData={scheduleData}
          // staffId={staffId}
          // onRefreshData={refreshScheduleData}
          // onRepeatChange={() => {}}
          isSaving={isSaving}
          mode="edit"
          readOnly={isReadOnlyMode} // 使用状态控制只读模式
          initialEvent={editingEvent}
          onEditFromReadOnly={() => {
            // 从只读模式进入编辑模式
            setIsReadOnlyMode(false);
          }}
        />
      )}
      

    </div>
  );
} 