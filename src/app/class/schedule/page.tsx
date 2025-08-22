'use client';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Calendar, momentLocalizer, Views, View } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/zh-cn';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './schedule.css';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import AddEventModal from './components/AddEventModal';
import {
  getStaffSchedule, getStaffInfo,
  addStaffInvigilate, updateStaffInvigilate, deleteStaffInvigilate,
  editStaffLesson, deleteStaffLesson, updateStaffUnavailable
} from '@/services/auth';
import { useSearchParams } from 'next/navigation';
import { useScheduleData, type ScheduleEvent } from './hooks/useScheduleData';
import { EventItem } from './components/EventItem';

// === 策略 ===
import { InvigilateStrategy } from './strategies/invigilate';
import { UnavailableStrategy } from './strategies/unavailable';
import { LessonStrategy } from './strategies/lesson';
import type { EventTypeStrategy } from './strategies/types';

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
  const urlStaffId = searchParams.get('staffId');

  const getCurrentStaffId = () => {
    if (urlStaffId) return urlStaffId;
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id?.toString() || '';
      }
    } catch (e) {}
    return '';
  };
  const staffId = getCurrentStaffId();

  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTimeRange, setSelectedTimeRange] = useState<{ start: Date; end: Date } | null>(null);
  const [modalPosition, setModalPosition] = useState<{ x: number; y: number; slideDirection?: 'left' | 'right' | 'center' }>();
  const [isClosingModal, setIsClosingModal] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [staffInfo, setStaffInfo] = useState<any>(null);
  const classTopicsRef = useRef<Record<string, string> | null>(null);

  // 统一数据来源
  const { raw, events, refresh, unavailableRanges } = useScheduleData({
    staffId,
    date,
    view: view === Views.WEEK ? 'week' : 'day',
    getStaffSchedule,
    classTopicsRef,
    staffName: staffInfo?.staff_name,
  });

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

  // 拉取 staffInfo
  useEffect(() => {
    if (!staffId) return;
    (async () => {
      const resp = await getStaffInfo(staffId);
      if (resp?.code === 200 && resp.data) setStaffInfo(resp.data);
    })();
  }, [staffId]);

  // RBC min/max：用当天时间
  const dayMin = useMemo(() => moment(date).hour(9).minute(0).second(0).toDate(), [date]);
  const dayMax = useMemo(() => moment(date).hour(22).minute(0).second(0).toDate(), [date]);

  // 冲突检查：课程/监考/不可用统一
  const hasConflict = useCallback((start: Date, end: Date) => {
    const hasEV = events.some(ev => ['lesson','invigilate'].includes(ev.type) && start < ev.end && end > ev.start);
    const hasUA = unavailableRanges.some(slot => start < slot.end && end > slot.start);
    return hasEV || hasUA;
  }, [events, unavailableRanges]);

  // 选区 & 定位
  const handleSelectSlot = useCallback(({ start, end, box }: any) => {
    setShowEditModal(false);
    const actualEnd = end || new Date(start.getTime() + 30 * 60 * 1000);
    if (hasConflict(start, actualEnd)) {
      alert('所选时间段与已有课程、监考或不可用时间重叠！');
      return;
    }
    setSelectedDate(start);
    setSelectedTimeRange({ start, end: actualEnd });

    // 使用 box/clientX/Y 或 fallback 居中
    const screenW = window.innerWidth; const modalW = 384;
    let x = (box?.clientX ?? box?.x ?? screenW / 2);
    let y = (box?.clientY ?? box?.y ?? 160);

    // 简单左右判断
    const leftEnough = x > modalW + 40;
    const rightEnough = screenW - x > modalW + 40;
    const slideDirection = rightEnough ? 'right' : leftEnough ? 'left' : 'center';
    if (rightEnough) x = x + 20; else if (leftEnough) x = x - modalW - 20; else x = Math.max(10, Math.min(x - modalW / 2, screenW - modalW - 10));

    setModalPosition({ x, y, slideDirection });
    setIsClosingModal(false);
    setShowAddModal(true);
  }, [hasConflict]);

  const handleSelectEvent = useCallback((event: ScheduleEvent) => {
    if (event.type === 'selected') return;
    setShowAddModal(false);
    setSelectedTimeRange(null);
    if (event.type === 'lesson') {
      setEditingEvent(event);
      setIsReadOnlyMode(true);
      setShowEditModal(true);
    } else {
      setEditingEvent(event);
      setIsReadOnlyMode(false);
      setShowEditModal(true);
    }
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

  // ===== 保存/编辑/删除（注意：不可用统一使用「秒」） =====
  const toSec = (d?: Date) => (d ? Math.floor(d.getTime() / 1000) : 0);

  const handleAddEvent = useCallback(async (payload: any) => {
    setIsSaving(true);
    try {
      const { type, start, end, topic_id, note } = payload;
      if (type === 'invigilate') {
        const resp = await addStaffInvigilate({ staff_id: staffId, start_time: toSec(start), end_time: toSec(end), topic_id: topic_id || '', note: note || '' });
        if (resp.status === 0) { await refresh(); setShowAddModal(false); setSelectedTimeRange(null); }
        else alert(`保存失败: ${resp.message}`);
      } else { // unavailable
        const cur = unavailableRanges.map(r => ({ start_time: toSec(r.start), end_time: toSec(r.end) }));
        const addOne = [{ start_time: toSec(start), end_time: toSec(end) }];
        const all = [...cur, ...addOne];
        const resp = await updateStaffUnavailable(staffId, { week_num: getWeekNum(date), event_type: 1 as const, time_list: all });
        if (resp.status === 0) { await refresh(); setShowAddModal(false); setSelectedTimeRange(null); }
        else alert(`保存失败: ${resp.message}`);
      }
    } catch (e) { alert('保存失败，请重试'); }
    finally { setIsSaving(false); }
  }, [staffId, date, refresh, unavailableRanges]);

  const handleEditEvent = useCallback(async (formData: any) => {
    setIsSaving(true);
    try {
      if (formData.type === 'lesson') {
        const resp = await editStaffLesson(staffId, {
          lesson_id: formData.id,
          subject_id: formData.subject_id || editingEvent?.subject_id || '',
          start_time: toSec(formData.start),
          end_time: toSec(formData.end),
          room_id: formData.pickRoom || '',
          repeat_num: formData.repeat_num || 1
        });
        if (resp.status === 0) { await refresh(); setShowEditModal(false); setEditingEvent(null); }
        else alert(`保存失败: ${resp.message}`);
      } else if (formData.type === 'invigilate') {
        const resp = await updateStaffInvigilate({
          record_id: String(formData.id).replace('invigilate_', ''),
          staff_id: staffId,
          start_time: toSec(formData.start),
          end_time: toSec(formData.end),
          topic_id: formData.topic_id || '',
          note: formData.note || ''
        });
        if (resp.status === 0) { await refresh(); setShowEditModal(false); setEditingEvent(null); }
        else alert(`保存失败: ${resp.message}`);
      } else if (formData.type === 'unavailable') {
        // 全量：现有 - 原 + 新（都用秒）
        const origS = toSec(editingEvent?.start); const origE = toSec(editingEvent?.end);
        const filtered = unavailableRanges.filter(r => !(toSec(r.start) === origS && toSec(r.end) === origE))
          .map(r => ({ start_time: toSec(r.start), end_time: toSec(r.end) }));
        const added = [{ start_time: toSec(formData.start), end_time: toSec(formData.end) }];
        const resp = await updateStaffUnavailable(staffId, { week_num: getWeekNum(date), event_type: 1 as const, time_list: [...filtered, ...added] });
        if (resp.status === 0) { await refresh(); setShowEditModal(false); setEditingEvent(null); }
        else alert(`保存失败: ${resp.message}`);
      }
    } catch { alert('保存失败，请重试'); }
    finally { setIsSaving(false); }
  }, [staffId, date, refresh, editingEvent, unavailableRanges]);

  const handleDeleteEvent = useCallback(async (repeat_num?: number) => {
    if (!editingEvent) return;
    setIsSaving(true);
    try {
      if (editingEvent.type === 'lesson') {
        const resp = await deleteStaffLesson(staffId, { lesson_ids: [editingEvent.id], repeat_num: repeat_num || 1 });
        if (resp.status === 0) { await refresh(); setShowEditModal(false); setEditingEvent(null); }
        else alert(`删除失败: ${resp.message}`);
      } else if (editingEvent.type === 'invigilate') {
        const id = String(editingEvent.id).replace('invigilate_', '');
        const resp = await deleteStaffInvigilate({ record_id: id });
        if (resp.status === 0) { await refresh(); setShowEditModal(false); setEditingEvent(null); }
        else alert(`删除失败: ${resp.message}`);
      } else if (editingEvent.type === 'unavailable') {
        const filtered = unavailableRanges
          .filter(r => !(r.start.getTime() === editingEvent.start.getTime() && r.end.getTime() === editingEvent.end.getTime()))
          .map(r => ({ start_time: toSec(r.start), end_time: toSec(r.end) }));
        const resp = await updateStaffUnavailable(staffId, { week_num: getWeekNum(date), event_type: 1 as const, time_list: filtered });
        if (resp.status === 0) { await refresh(); setShowEditModal(false); setEditingEvent(null); }
        else alert(`删除失败: ${resp.message}`);
      }
    } catch { alert('删除失败，请重试'); }
    finally { setIsSaving(false); }
  }, [editingEvent, staffId, date, unavailableRanges, refresh]);

  const handleDeleteUnavailable = useCallback(async (conflicts: Array<{ start: Date; end: Date }>) => {
    setIsSaving(true);
    try {
      const overlap = (a: { start: Date; end: Date }, b: { start: Date; end: Date }) => a.start < b.end && a.end > b.start;
      const kept = unavailableRanges
        .filter(slot => !conflicts.some(c => overlap(slot, c)))
        .map(r => ({ start_time: toSec(r.start), end_time: toSec(r.end) }));
      const resp = await updateStaffUnavailable(staffId, { week_num: getWeekNum(date), event_type: 1 as const, time_list: kept });
      if (resp.status === 0) { await refresh(); setShowAddModal(false); setSelectedTimeRange(null); }
      else alert(`删除失败: ${resp.message}`);
    } catch { alert('删除失败，请重试'); }
    finally { setIsSaving(false); }
  }, [staffId, date, unavailableRanges, refresh]);

  // 工具：周编号（与后端对齐）
  function getWeekNum(d: Date) {
    const base = new Date(1970, 0, 1);
    const diff = d.getTime() - base.getTime();
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const adjustedDays = days - 4;
    return adjustedDays < 0 ? 0 : Math.floor(adjustedDays / 7);
  }

  // 样式（包含不可用）
  const eventStyleGetter = useCallback((event: ScheduleEvent) => {
    let backgroundColor = 'rgba(49,116,173,0.8)';
    let borderColor = '#3174ad';
    const style: React.CSSProperties = { color: 'white', border: `1px solid ${borderColor}`, borderRadius: '4px', fontSize: 12, zIndex: 1 };

    switch (event.type) {
      case 'lesson': backgroundColor = 'rgba(59,130,246,0.8)'; borderColor = '#2563eb'; break;
      case 'invigilate': backgroundColor = 'rgba(34,197,94,0.8)'; borderColor = '#16a34a'; break;
      case 'unavailable': backgroundColor = 'rgba(107,114,128,0.25)'; borderColor = 'rgba(107,114,128,0.5)'; Object.assign(style, { pointerEvents: 'none', zIndex: 0, borderStyle: 'dashed' as const }); break;
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-auto">
      <div className="bg-white shadow-sm border-b border-gray-200 px-3 sm:px-6 py-4 sticky top-0 z-40 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">{staffInfo ? `${staffInfo.staff_name}'s Schedule` : 'Schedule'}</h1>
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
          <div className="flex items-center space-x-1 sm:space-x-2"><div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded"></div><span className="text-gray-600 whitespace-nowrap">监考</span></div>
          <div className="flex items-center space-x-1 sm:space-x-2"><div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-300 rounded"></div><span className="text-gray-600 whitespace-nowrap">不可用时段</span></div>
        </div>
      </div>

      {/* 日历主体 */}
      <div className="flex-1 pt-3 sm:pt-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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

      {/* 新增弹窗：只开放 invigilate / unavailable */}
      <AddEventModal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        onSave={handleAddEvent}
        selectedDate={selectedDate}
        onTimeChange={onTimeChange}
        selectedTimeRange={selectedTimeRange || undefined}
        position={modalPosition}
        onAnimationComplete={handleAnimationComplete}
        onConflictCheck={(s, e) => unavailableRanges.filter(u => s < u.end && e > u.start)}
        scheduleData={raw || {}}                  // 传完整 raw，策略可用 room_info / class_topics
        isSaving={isSaving}
        mode="add"
        onDeleteUnavailable={handleDeleteUnavailable}
        typeRegistry={STRATEGIES}
        allowedTypes={['lesson']}
        defaultType="invigilate"
        api={{
          staffId,
          getWeekNum,
          date,
          addStaffInvigilate: (p) => addStaffInvigilate({...p, note: p.note || ''}),
          updateStaffInvigilate: (p) => updateStaffInvigilate({...p, note: p.note || ''}),
          deleteStaffInvigilate,
          updateStaffUnavailable,
          editStaffLesson: (staffId, p) => editStaffLesson(staffId, {...p, subject_id: p.subject_id || '', room_id: p.room_id ? String(p.room_id) : ''}),
          deleteStaffLesson
        }}
        unavailableRangesSec={unavailableRanges.map(r => ({ start_time: toSec(r.start), end_time: toSec(r.end) }))}
        onSaved={refresh}
      />

      {/* 编辑弹窗：锁定为当前事件类型 */}
      {showEditModal && editingEvent && (
        <AddEventModal
          isOpen={showEditModal}
          onClose={() => { setShowEditModal(false); setEditingEvent(null); setIsReadOnlyMode(false); }}
          onSave={handleEditEvent}
          onDelete={handleDeleteEvent}
          selectedDate={editingEvent.start}
          onTimeChange={onTimeChange}
          position={modalPosition}
          onAnimationComplete={handleAnimationComplete}
          onConflictCheck={(s, e) => unavailableRanges.filter(u => s < u.end && e > u.start)}
          scheduleData={raw || {}}
          isSaving={isSaving}
          mode="edit"
          readOnly={isReadOnlyMode}
          initialEvent={editingEvent}
          onEditFromReadOnly={() => setIsReadOnlyMode(false)}
          typeRegistry={STRATEGIES}
          allowedTypes={editingEvent.type !== 'selected' ? [editingEvent.type as 'lesson' | 'unavailable' | 'invigilate'] : ['invigilate']}
          defaultType={editingEvent.type !== 'selected' ? editingEvent.type as 'lesson' | 'unavailable' | 'invigilate' : 'invigilate'}
          api={{
            staffId,
            getWeekNum,
            date,
            addStaffInvigilate: (p) => addStaffInvigilate({...p, note: p.note || ''}),
            updateStaffInvigilate: (p) => updateStaffInvigilate({...p, note: p.note || ''}),
            deleteStaffInvigilate,
            updateStaffUnavailable,
            editStaffLesson: (staffId, p) => editStaffLesson(staffId, {...p, subject_id: p.subject_id || '', room_id: p.room_id ? String(p.room_id) : ''}),
            deleteStaffLesson
          }}
          unavailableRangesSec={unavailableRanges.map(r => ({ start_time: toSec(r.start), end_time: toSec(r.end) }))}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
