// =============================================
// file: src/app/class/schedule/components/AddEventModal.tsx
// 描述：策略外壳（Strategy Shell）版本的 AddEventModal
// - 通用 UI：时间选择、动画/拖拽/定位、冲突提示、删除确认
// - 类型相关：表单渲染/校验/保存/删除 委托给策略（可选）
// - 兼容旧用法：若未提供策略，则回退到原有 onSave/onDelete 组装逻辑
// =============================================
'use client';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import moment from 'moment';
import TimePicker from '../../../../components/TimePicker';
import Button from '../../../../components/Button';
import NumberInput from '../../../../components/NumberInput';
import type { EventKind, EventTypeStrategy, ApiBundle, StrategyCtx } from '../strategies/types';

// 统一时间限制
const DAY_START_TIME = '09:00';
const DAY_END_TIME = '22:00';

// 去抖的冲突检测 hook
function useDebouncedConflict(
  enabled: boolean,
  start: Date | null,
  end: Date | null,
  onConflictCheck?: (s: Date, e: Date) => Array<{ start: Date; end: Date }>,
  delay = 250
) {
  const [conflicts, setConflicts] = useState<Array<{ start: Date; end: Date }>>([]);
  useEffect(() => {
    if (!enabled || !start || !end || !onConflictCheck) {
      setConflicts([]);
      return;
    }
    const id = setTimeout(() => setConflicts(onConflictCheck(start, end)), delay);
    return () => clearTimeout(id);
  }, [enabled, start?.getTime(), end?.getTime(), onConflictCheck, delay]);
  return conflicts;
}

// 原事件类型（与页面一致）
interface ScheduleEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'lesson' | 'unavailable' | 'invigilate';
  description?: string;
  repeat?: 'none' | 'weekly';
  // 仅用于显示/兼容
  subject_id?: number;
  room_id?: number;
  class_id?: number;
  students?: string;
  students_ids?: number[];
  room_name?: string;
  teacher?: string;
  student_name?: string;
  topic_id?: string;
  note?: string;
  campus?: string;
  pickRoom?: string | number;
  replaceRoomWhenBooked?: boolean;
}

// 组件 props（在原 props 基础上增加策略相关可选项）
interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTimeChange: (startTime: string, endTime: string) => void;
  onSave: (event: Partial<ScheduleEvent> & {
    repeat?: 'none' | 'weekly';
    subject?: string;
    campus?: string;
    pickRoom?: string | number;
    replaceRoomWhenBooked?: boolean;
    id?: string;
    mode?: 'add' | 'edit';
    topic_id?: string;
    note?: string;
    repeat_num?: number;
  }) => void;
  onRepeatChange?: (repeat: 'none' | 'weekly') => void;
  selectedDate?: Date;
  selectedTimeRange?: { start: Date; end: Date };
  position?: { x: number; y: number; slideDirection?: 'left' | 'right' | 'center' };
  onAnimationComplete?: () => void;
  onConflictCheck?: (start: Date, end: Date) => Array<{ start: Date; end: Date }>;
  scheduleData?: any;
  isSaving?: boolean;
  mode?: 'add' | 'edit';
  readOnly?: boolean;
  initialEvent?: any;
  onDelete?: (repeat_num?: number) => void;
  onDeleteUnavailable?: (conflicts: Array<{ start: Date; end: Date }>) => void;
  onEditFromReadOnly?: () => void;
  // ===== 策略相关（可选，传入则启用策略模式） =====
  typeRegistry?: Record<EventKind, EventTypeStrategy<any>>;
  allowedTypes?: EventKind[]; // 父组件决定允许哪些类型（lesson/unavailable/invigilate）
  defaultType?: EventKind;
  api?: ApiBundle;
  unavailableRangesSec?: Array<{ start_time: number; end_time: number }>; // 秒，用于策略内部不可用计算
  onSaved?: () => void; // 策略保存/删除成功后的回调（一般用于刷新）
  onError?: (errorData: { teacher_error?: string[]; student_error?: string[]; room_error?: string[] }) => void; // 错误处理回调
}

const typeLabel: Record<EventKind, string> = {
  lesson: '课程',
  unavailable: '不可用时段',
  invigilate: '监考',
};

export default function AddEventModal({
  isOpen,
  onClose,
  onSave,
  onTimeChange,
  selectedDate,
  selectedTimeRange,
  position,
  onAnimationComplete,
  onConflictCheck,
  scheduleData,
  isSaving = false,
  mode = 'add',
  readOnly = false,
  initialEvent,
  onDelete,
  onDeleteUnavailable,
  onEditFromReadOnly,
  // 策略相关
  typeRegistry,
  allowedTypes,
  defaultType,
  api,
  unavailableRangesSec,
  onSaved,
  onError,
}: AddEventModalProps) {
  // ===== 基础状态 =====
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:15');
  const [eventType, setEventType] = useState<EventKind>((defaultType ?? allowedTypes?.[0] ?? 'invigilate') as EventKind);
  const [description, setDescription] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const [repeat, setRepeat] = useState<'none' | 'weekly'>('none');

  // 兼容旧表单（无策略时使用）
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedCampus, setSelectedCampus] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<string | number>('');
  const [replaceRoomWhenBooked, setReplaceRoomWhenBooked] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [note, setNote] = useState('');
  const [repeatNum, setRepeatNum] = useState(1);

  // 删除相关
  const [showDeleteMode, setShowDeleteMode] = useState(false);
  const [deleteRepeatNum, setDeleteRepeatNum] = useState(1);

  // 拖拽
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, startOffsetX: 0, startOffsetY: 0 });

  // ===== 初始化 =====
  useEffect(() => {
    if (!isOpen) {
      setStartTime('09:00');
      setEndTime('09:15');
      setEventType((defaultType ?? allowedTypes?.[0] ?? 'invigilate') as EventKind);
      setDescription('');
      setRepeat('none');
      setSelectedSubject('');
      setSelectedCampus('');
      setSelectedRoom('');
      setReplaceRoomWhenBooked(false);
      setSelectedTopic('');
      setNote('');
      setRepeatNum(1);
      setShowDeleteMode(false);
      setDeleteRepeatNum(1);
    } else {
      // 初始化下拉默认项（兼容旧逻辑）
      if (scheduleData?.class_topics) {
        const firstTopic = Object.keys(scheduleData.class_topics)[0];
        setSelectedTopic(firstTopic || '');
      }
      if (scheduleData?.campus_info) {
        const firstCampus = Object.keys(scheduleData.campus_info)[0];
        setSelectedCampus(firstCampus || '');
      }
      if (scheduleData?.room_info) {
        const firstRoom = Object.keys(scheduleData.room_info)[0];
        setSelectedRoom(firstRoom || '');
      }
    }
  }, [isOpen, scheduleData, defaultType, allowedTypes]);

  // 编辑模式加载初值
  useEffect(() => {
    if (mode === 'edit' && initialEvent) {
      setStartTime(moment(initialEvent.start).format('HH:mm'));
      setEndTime(moment(initialEvent.end).format('HH:mm'));
      setEventType(initialEvent.type || eventType);
      setDescription(initialEvent.description || '');
      setRepeat(initialEvent.repeat || 'none');
      setSelectedSubject(initialEvent.subject || '');
      setSelectedCampus(initialEvent.campus || '');
      setSelectedRoom(initialEvent.room_id?.toString?.() ?? initialEvent.pickRoom ?? '');
      setReplaceRoomWhenBooked(!!initialEvent.replaceRoomWhenBooked);
      setSelectedTopic(initialEvent.topic_id || '');
      setNote(initialEvent.note || '');
      setRepeatNum(initialEvent.repeat_num || 1);
    }
  }, [mode, initialEvent]);

  // 类型影响默认重复
  useEffect(() => {
    if (isOpen && mode !== 'edit') {
      if (eventType === 'unavailable') setRepeat('none');
      else if (eventType === 'lesson') setRepeat('none');
    }
  }, [eventType, isOpen, mode]);

  // ESC 关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    if (isOpen) { document.addEventListener('keydown', handleKeyDown); return () => document.removeEventListener('keydown', handleKeyDown); }
  }, [isOpen, onClose]);

  // 拖拽开始
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isCloseButton = target.closest('button');
    if (!isCloseButton) {
      e.preventDefault();
      dragRef.current = { isDragging: true, startX: e.clientX, startY: e.clientY, startOffsetX: dragOffset.x, startOffsetY: dragOffset.y };
      setIsDragging(true);
      const handleMove = (ev: MouseEvent) => {
        if (dragRef.current.isDragging) {
          setDragOffset({ x: dragRef.current.startOffsetX + (ev.clientX - dragRef.current.startX), y: dragRef.current.startOffsetY + (ev.clientY - dragRef.current.startY) });
        }
      };
      const handleUp = () => { dragRef.current.isDragging = false; setIsDragging(false); document.removeEventListener('mousemove', handleMove); document.removeEventListener('mouseup', handleUp); };
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
    }
  };

  // 动画控制
  useEffect(() => {
    if (isOpen) {
      setDragOffset({ x: 0, y: 0 }); setIsDragging(false);
      dragRef.current = { isDragging: false, startX: 0, startY: 0, startOffsetX: 0, startOffsetY: 0 };
      setShouldShow(true); setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      const t = setTimeout(() => { setShouldShow(false); onAnimationComplete?.(); }, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen, onAnimationComplete]);

  // 选中时间范围回填
  useEffect(() => {
    if (selectedTimeRange && isOpen) {
      setStartTime(moment(selectedTimeRange.start).format('HH:mm'));
      setEndTime(moment(selectedTimeRange.end).format('HH:mm'));
    }
  }, [selectedTimeRange, isOpen]);

  // ===== 时间与冲突 =====
  const start = useMemo(() => {
    if (!selectedDate) return null;
    const [h, m] = startTime.split(':').map(Number);
    const d = new Date(selectedDate); d.setHours(h, m, 0, 0); return d;
  }, [selectedDate, startTime]);

  const end = useMemo(() => {
    if (!selectedDate) return null;
    const [h, m] = endTime.split(':').map(Number);
    const d = new Date(selectedDate); d.setHours(h, m, 0, 0); return d;
  }, [selectedDate, endTime]);

  const currentConflicts = useDebouncedConflict(Boolean(isOpen && selectedDate), start, end, onConflictCheck, 250);
  const conflictOnlyDelete = currentConflicts && currentConflicts.length > 0;

  const startTimeConstraints = useMemo(() => ({ minTime: DAY_START_TIME, maxTime: endTime < DAY_END_TIME ? endTime : DAY_END_TIME }), [endTime]);
  const endTimeConstraints = useMemo(() => ({ minTime: startTime > DAY_START_TIME ? startTime : DAY_START_TIME, maxTime: DAY_END_TIME }), [startTime]);

  // ===== 策略：表单缓存 & 上下文 =====
  const hasStrategy = !!typeRegistry && !!allowedTypes?.length;
  const strategy = hasStrategy ? typeRegistry![eventType] : undefined;
  const [formMap, setFormMap] = useState<Record<string, any>>({});
  const ctx: StrategyCtx | undefined = useMemo(() => {
    if (!hasStrategy || !start || !end) return undefined as any;
    return { mode, readOnly, scheduleData, initialEvent, selectedDate, start, end, unavailableRangesSec };
  }, [hasStrategy, mode, readOnly, scheduleData, initialEvent, selectedDate, start, end, unavailableRangesSec]);

  // 策略验证状态
  const validationErrors = useMemo(() => {
    if (!hasStrategy || !strategy || !ctx) return [];
    const form = formMap[eventType] || {};
    return strategy.validate?.(form, ctx) ?? [];
  }, [hasStrategy, strategy, ctx, formMap, eventType]);

  const hasValidationErrors = validationErrors.length > 0;

  // 首次进入某策略时 init 表单
  useEffect(() => {
    if (!hasStrategy || !strategy || !isOpen || !ctx) return;
    setFormMap(prev => (prev[strategy.key] != null ? prev : { ...prev, [strategy.key]: strategy.init(ctx) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStrategy, strategy?.key, isOpen, initialEvent]);

  const form = strategy ? (formMap[strategy.key] ?? (ctx ? strategy.init(ctx) : {})) : undefined;
  const setForm = (patch: any) => { if (!strategy) return; setFormMap(prev => ({ ...prev, [strategy.key]: { ...form, ...patch } })); };

  // ===== 计算模态尺寸与定位（保留原逻辑但更紧凑） =====
  // 简化DOM查找逻辑
  const findEventElement = (): Element | null => {
    if (typeof document === 'undefined') return null;

    // 编辑模式：查找对应的事件元素
    if (mode === 'edit' && initialEvent) {
      const eventId = initialEvent.id;
      if (eventId) {
        const element = document.querySelector(`[data-event-id="${eventId}"]`) ||
                       document.querySelector(`.rbc-event[title*="${initialEvent.title || ''}"]`);
        if (element) return element;
      }

      // 通过时间匹配
      if (initialEvent.start) {
        const eventTime = moment(initialEvent.start).format('HH:mm');
        const allEvents = document.querySelectorAll('.rbc-event');
        for (const eventEl of allEvents) {
          const title = eventEl.getAttribute('title');
          if (title?.includes(eventTime)) return eventEl;
        }
      }
    }

    // 新建模式：查找选中的时间段
    const customEvents = document.querySelectorAll('.rbc-event .custom-event');
    for (const customEvent of customEvents) {
      if (customEvent.textContent?.includes('选中时间段')) {
        return customEvent.closest('.rbc-event');
      }
    }

    // 最后备选：通过title查找
    const allEvents = document.querySelectorAll('.rbc-event');
    for (const eventEl of allEvents) {
      if (eventEl.getAttribute('title')?.includes('选中时间段')) {
        return eventEl;
      }
    }

    return null;
  };

  const calculateModalProps = (): { modalStyle: React.CSSProperties; modalClassName: string; contentMaxHeight?: number } => {
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
    const modalWidth = 384;
    const margin = 16;
    const estimatedContentHeight = 480;
    const headerHeight = 50;
    const footerHeight = 70;

    // 计算弹框尺寸
    const maxAvailableHeight = screenHeight - 2 * margin;
    const modalHeight = estimatedContentHeight > maxAvailableHeight ?
                       maxAvailableHeight : estimatedContentHeight;
    const contentMaxHeight = estimatedContentHeight > maxAvailableHeight ?
                            modalHeight - headerHeight - footerHeight : undefined;

    let adjustedX: number;
    let adjustedY: number;
    let finalSlideDirection: 'left' | 'right' | 'center' = 'center';
    const modalClassName: string = 'bg-white rounded-lg shadow-2xl border border-gray-200';

    // 查找事件元素
    const selectedEventElement = findEventElement();

    // 统一的定位计算函数
    const calculatePosition = (rect: DOMRect, isEventElement = false) => {
      const elementCenterX = rect.left + rect.width / 2;
      const elementLeft = rect.left;
      const elementRight = rect.right;

      // X坐标计算：智能选择左右位置
      const safeMargin = isEventElement ? 10 : 0; // 事件元素需要额外安全距离
      const leftSpace = elementLeft - margin;
      const rightSpace = screenWidth - elementRight - margin;

      let x: number;
      if (rightSpace >= modalWidth + safeMargin) {
        x = elementRight + safeMargin;
        finalSlideDirection = 'right';
      } else if (leftSpace >= modalWidth + safeMargin) {
        x = elementLeft - modalWidth - safeMargin;
        finalSlideDirection = 'left';
      } else {
        x = elementCenterX - modalWidth / 2;
        finalSlideDirection = 'center';
        // 边界检查
        x = Math.max(margin, Math.min(x, screenWidth - modalWidth - margin));
      }

      // Y坐标计算：垂直居中对齐
      const elementCenterY = rect.top + rect.height / 2;
      let y = elementCenterY - modalHeight / 2;

      // 边界检查和调整
      if (y < margin) y = Math.max(margin, rect.top);
      else if (y + modalHeight > screenHeight - margin) {
        y = Math.max(margin, rect.bottom - modalHeight);
      }

      return { x, y };
    };

    if (selectedEventElement) {
      // 基于找到的事件元素定位
      const rect = selectedEventElement.getBoundingClientRect();
      const pos = calculatePosition(rect, true);
      adjustedX = pos.x;
      adjustedY = pos.y;
    } else if (position) {
      // 基于传入的位置参数定位
      const { x, y, slideDirection = 'right' } = position;
      const scrollTop = window?.pageYOffset || document?.documentElement.scrollTop || 0;
      const scrollLeft = window?.pageXOffset || document?.documentElement.scrollLeft || 0;

      // 转换为视口坐标
      const viewportX = x - scrollLeft;
      const viewportY = y - scrollTop;

      // 创建虚拟的DOMRect来复用计算逻辑
      const virtualRect = new DOMRect(viewportX, viewportY, 0, 0);
      const pos = calculatePosition(virtualRect, false);
      adjustedX = pos.x;
      adjustedY = pos.y;
      finalSlideDirection = slideDirection;
    } else {
      // 默认居中显示
      adjustedX = (screenWidth - modalWidth) / 2;
      adjustedY = (screenHeight - modalHeight) / 2;
      finalSlideDirection = 'center';

      // 边界检查
      adjustedX = Math.max(margin, Math.min(adjustedX, screenWidth - modalWidth - margin));
      adjustedY = Math.max(margin, Math.min(adjustedY, screenHeight - modalHeight - margin));
    }

    let transform: string;
    if (isAnimating) transform = 'translateX(0) scale(1)';
    else {
      switch (finalSlideDirection) { case 'left': transform = 'translateX(50px) scale(0.95)'; break; case 'right': transform = 'translateX(-50px) scale(0.95)'; break; default: transform = 'translateY(-20px) scale(0.95)'; }
    }

    const modalStyle = { position: 'fixed', left: `${adjustedX}px`, top: `${adjustedY}px`, height: `${modalHeight}px`, width: `${modalWidth}px`, maxWidth: 'calc(100vw - 2rem)', zIndex: 1000, transform, opacity: isAnimating ? 1 : 0, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' } as React.CSSProperties;
    return { modalStyle, modalClassName, contentMaxHeight };
  };

  const { modalStyle, modalClassName } = calculateModalProps();
  const baseTransform = modalStyle.transform?.replace(/translate[XY]?\([^)]*\)/g, '') || '';
  const dragTransform = `translate(${dragOffset.x}px, ${dragOffset.y}px)`;
  const finalTransform = `${dragTransform} ${baseTransform}`.trim();
  const finalModalStyle = { ...modalStyle, transform: finalTransform, transition: isDragging ? 'none' : modalStyle.transition } as React.CSSProperties;

  if (!shouldShow) return null;

  // ===== 提交 / 删除 =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !start || !end) return;

    // 策略模式：优先调用策略
    if (hasStrategy && strategy && ctx && api) {
      try {
        // 验证已在UI层处理，这里直接保存
        await strategy.onSave(form, ctx, api);
        onSaved?.();
        onClose();
              } catch (err: any) {
          // 检查是否是详细错误信息
          if (err?.data && typeof err.data === 'object' &&
              ('teacher_error' in err.data || 'student_error' in err.data || 'room_error' in err.data)) {
            // 触发父组件的错误处理
            if (onError) {
              const errorData = {
                teacher_error: err.data.teacher_error || [],
                student_error: err.data.student_error || [],
                room_error: err.data.room_error || []
              };
              onError(errorData);
              return; // 成功处理错误，不显示alert
            }
          }
          alert(err?.message || '保存失败');
        }
      return;
    }

    // 兼容旧逻辑：组装 payload 调用父 onSave
    onSave({
      start,
      end,
      type: eventType,
      description,
      repeat,
      subject: eventType === 'lesson' ? selectedSubject : '',
      campus: selectedCampus,
      pickRoom: selectedRoom,
      replaceRoomWhenBooked,
      id: initialEvent?.id,
      mode,
      topic_id: eventType === 'invigilate' ? selectedTopic : '',
      note: eventType === 'invigilate' ? note : '',
      repeat_num: repeatNum,
    });
  };

  const handleDeleteByStrategy = async () => {
    // 优先策略删除
    if (hasStrategy && strategy?.onDelete && api && initialEvent?.id && ctx) {
      try {
        await strategy.onDelete({ id: String(initialEvent.id), repeat_num: deleteRepeatNum }, ctx, api);
        onSaved?.();
        onClose();
      } catch (err: any) { alert(err?.message || '删除失败'); }
      return;
    }
    // 回退给父
    if (showDeleteMode) {
      if (initialEvent?.type === 'invigilate') onDelete?.();
      else onDelete?.(deleteRepeatNum);
    }
  };

  // ===== 渲染 =====
  const renderTypeSelector = () => {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">类型</label>
        {(mode === 'edit' || readOnly) ? (
          <input
            type="text"
            value={typeLabel[eventType] || '类型'}
            readOnly
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-gray-50"
          />
        ) : hasStrategy && allowedTypes && allowedTypes.length ? (
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value as EventKind)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {allowedTypes.map(t => (
              <option key={t} value={t}>{typeLabel[t]}</option>
            ))}
          </select>
        ) : (
          // 旧：仅允许不可用/监考
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value as any)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="invigilate">监考</option>
            <option value="unavailable">不可用时段</option>
          </select>
        )}
      </div>
    );
  };

  const renderStrategyForm = () => {
    if (!(hasStrategy && strategy && ctx)) return null;
    // 策略自行渲染表单（表单状态通过 form/setForm 传递）
    return strategy.render({ form, setForm, readOnly, scheduleData, ctx });
  };

  const renderFallbackForm = () => {
    // 当未启用策略时，使用旧表单（仅 invigilate / unavailable）。
    if (eventType === 'invigilate') {
      return (
        <>
          {scheduleData?.class_topics && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">监考科目</label>
              {readOnly ? (
                <p className="w-full px-3 py-1.5 text-sm text-gray-900 bg-gray-50 rounded-md border border-gray-200">
                  {scheduleData.class_topics[selectedTopic] || selectedTopic}
                </p>
              ) : (
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md"
                >
                  {Object.entries(scheduleData.class_topics as Record<string, string>).map(([id, name]: any) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              )}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">备注</label>
            {readOnly ? (
              <p className="w-full px-3 py-1.5 text-sm text-gray-900 bg-gray-50 rounded-md border border-gray-200">{note}</p>
            ) : (
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
                placeholder="请输入监考备注"
              />
            )}
          </div>
        </>
      );
    }

    // unavailable 没有额外字段
    return null;
  };

  return (
    <>
      {/* 背景遮罩 */}
      <div className="fixed inset-0 z-50 pointer-events-none" style={{ background: 'rgba(0,0,0,0.1)', opacity: isAnimating ? 0.5 : 0, transition: 'opacity 0.3s ease-in-out' }} />

      {/* 模态框 */}
      <div style={finalModalStyle} className={modalClassName} data-modal="add-event">
        <div className="flex flex-col h-full overflow-hidden">
          {/* 头部 */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100 bg-white rounded-t-lg cursor-move" onMouseDown={handleMouseDown} style={{ userSelect: 'none' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">
                {conflictOnlyDelete ? '删除不可用时间段' : showDeleteMode ? '删除确认' : readOnly ? '安排详情' : mode === 'edit' ? '编辑安排' : '添加安排'}
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer" title="关闭 (ESC)" onMouseDown={(e) => e.stopPropagation()}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {conflictOnlyDelete && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md"><p className="text-xs text-yellow-700">所选时间段与不可用时间段重合，只能删除该不可用时间段。</p></div>
            )}
          </div>

          {/* 内容 */}
          <div className="flex-1 overflow-y-auto min-h-0 bg-white">
            {conflictOnlyDelete ? (
              <div className="p-4 text-center text-sm text-gray-700">
                <p>不可用时间段：{currentConflicts.map((slot, idx) => (
                  <span key={idx} className="ml-1 font-medium">{moment(slot.start).format('HH:mm')}-{moment(slot.end).format('HH:mm')}{idx < currentConflicts.length - 1 && '，'}</span>
                ))}</p>
              </div>
            ) : showDeleteMode ? (
              <div className="p-4">
                <div className="text-center text-sm text-gray-700 mb-4">
                  <p className="text-red-600 font-medium mb-2">确认删除以下安排？</p>
                  <p className="text-gray-600">{initialEvent?.title || '未知安排'} - {moment(initialEvent?.start).format('MM月DD日 HH:mm')} 至 {moment(initialEvent?.end).format('HH:mm')}</p>
                </div>
                {initialEvent?.type === 'lesson' && (
                  <>
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <h4 className="text-sm font-medium text-red-800 mb-2">删除设置</h4>
                      <NumberInput label="删除周数" value={deleteRepeatNum} onChange={setDeleteRepeatNum} min={1} max={52} size="sm" helpText="设置要删除的周数" />
                    </div>
                    <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <p className="text-yellow-700 text-xs">删除后将同时删除后续 {deleteRepeatNum} 周的相同安排</p>
                    </div>
                  </>
                )}
                {initialEvent?.type === 'invigilate' && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3"><p className="text-red-700 text-sm">确认删除此监考安排？删除后无法恢复。</p></div>
                )}
              </div>
            ) : (
              <div className="p-4">
                <div className="space-y-3">
                  {/* 类型选择 */}
                  {renderTypeSelector()}

                  {/* 策略或回退表单 */}
                  {hasStrategy ? renderStrategyForm() : renderFallbackForm()}

                  {/* 选择日期展示 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">选择日期</label>
                    <p className="w-full px-3 py-1.5 text-sm text-gray-900 bg-gray-50 rounded-md border border-gray-200">{selectedDate ? moment(selectedDate).format('YYYY-MM-DD') : ''}</p>
                  </div>

                  {/* 时间选择 */}
                  <div className="grid grid-cols-2 gap-2">
                    {readOnly ? (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">开始时间</label>
                          <p className="w-full px-3 py-1.5 text-sm text-gray-900 bg-gray-50 rounded-md border border-gray-200">{startTime}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">结束时间</label>
                          <p className="w-full px-3 py-1.5 text-sm text-gray-900 bg-gray-50 rounded-md border border-gray-200">{endTime}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <TimePicker
                          label="开始时间"
                          value={startTime}
                          onChange={(newStartTime) => {
                            setStartTime(newStartTime);
                            onTimeChange(newStartTime, endTime);
                            if (newStartTime >= endTime) {
                              const [hours, minutes] = newStartTime.split(':').map(Number);
                              const nextMinutes = minutes + 15;
                              const nextHours = nextMinutes >= 60 ? hours + 1 : hours;
                              const adjustedMinutes = nextMinutes >= 60 ? nextMinutes - 60 : nextMinutes;
                              const newEndTime = `${String(nextHours).padStart(2, '0')}:${String(adjustedMinutes).padStart(2, '0')}`;
                              const finalEndTime = newEndTime <= DAY_END_TIME ? newEndTime : DAY_END_TIME;
                              setEndTime(finalEndTime);
                              onTimeChange(newStartTime, finalEndTime);
                            }
                          }}
                          {...startTimeConstraints}
                        />
                        <TimePicker
                          label="结束时间"
                          value={endTime}
                          onChange={(newEndTime) => {
                            setEndTime(newEndTime);
                            onTimeChange(startTime, newEndTime);
                            if (newEndTime <= startTime) {
                              const [hours, minutes] = newEndTime.split(':').map(Number);
                              const prevMinutes = minutes - 15;
                              const prevHours = prevMinutes < 0 ? hours - 1 : hours;
                              const adjustedMinutes = prevMinutes < 0 ? prevMinutes + 60 : prevMinutes;
                              const newStart = `${String(prevHours).padStart(2, '0')}:${String(adjustedMinutes).padStart(2, '0')}`;
                              const finalStartTime = newStart >= DAY_START_TIME ? newStart : DAY_START_TIME;
                              setStartTime(finalStartTime);
                              onTimeChange(finalStartTime, newEndTime);
                            }
                          }}
                          {...endTimeConstraints}
                        />
                      </>
                    )}
                  </div>

                  {/* 重复（仅旧逻辑下 lesson 用；策略应自行处理） */}
                  {(!hasStrategy && eventType === 'lesson' && !readOnly) && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">每周重复</label>
                      <div className="space-y-2">
                        <select
                          value={repeat}
                          onChange={e => setRepeat(e.target.value as 'none' | 'weekly')}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md"
                        >
                          <option value="none">不重复</option>
                          <option value="weekly">每周</option>
                        </select>
                        {repeat === 'weekly' && (
                          <NumberInput label="重复次数" value={repeatNum} onChange={setRepeatNum} min={1} max={52} size="sm" helpText="设置重复的周数" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 底部 */}
          <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 bg-white rounded-b-lg">
            {/* 验证错误提示 */}
            {hasValidationErrors && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
                <div className="flex items-start">
                  <span className="text-red-500 mr-2">⚠️</span>
                  <div className="text-sm text-red-700">
                    {validationErrors.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              {conflictOnlyDelete ? (
                <Button variant="danger" size="sm" onClick={() => onDeleteUnavailable?.(currentConflicts)} disabled={isSaving}>删除不可用时间段</Button>
              ) : showDeleteMode ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setShowDeleteMode(false)}>取消</Button>
                  <Button variant="danger" size="sm" onClick={handleDeleteByStrategy} disabled={isSaving}>{isSaving ? '删除中...' : '确认删除'}</Button>
                </>
              ) : readOnly ? (
                <>
                  <Button variant="ghost" size="sm" onClick={onClose}>关闭</Button>
                  <Button variant="primary" size="sm" onClick={onEditFromReadOnly}>编辑</Button>
                </>
              ) : (
                <>
                  {mode === 'edit' && (
                    <Button variant="danger" size="sm" onClick={() => setShowDeleteMode(true)} disabled={isSaving}>删除</Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={onClose}>取消</Button>
                  <Button variant="primary" size="sm" onClick={handleSubmit} disabled={!selectedDate || !startTime || !endTime || isSaving || hasValidationErrors}>{isSaving ? '保存中...' : '保存'}</Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
