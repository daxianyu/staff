import { useState, useEffect, useCallback, useRef } from 'react';
import moment from 'moment';
import TimePicker from '../../../components/TimePicker';
import Button from '../../../components/Button';

interface ScheduleEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  teacherId: string;
  teacherName: string;
  type: 'lesson' | 'available' | 'unavailable';
  description?: string;
}

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Partial<ScheduleEvent>) => void;
  selectedDate?: Date;
  selectedTimeRange?: { start: Date; end: Date };
  position?: { x: number; y: number; slideDirection?: 'left' | 'right' | 'center' };
  onAnimationComplete?: () => void;
  onTimeRangeChange?: (timeRange: { start: Date; end: Date }) => void;
}

export default function AddEventModal({ 
  isOpen, 
  onClose, 
  onSave,
  selectedDate,
  selectedTimeRange,
  position,
  onAnimationComplete,
  onTimeRangeChange
}: AddEventModalProps) {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:15');
  const [eventType, setEventType] = useState<'lesson' | 'available' | 'unavailable'>('lesson');
  const [description, setDescription] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  // 拖拽相关状态
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // 使用 ref 存储拖拽状态，避免闭包问题
  const dragRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    startOffsetX: 0,
    startOffsetY: 0
  });

  // 时间限制配置（从SchedulePage的日历配置同步）
  const DAY_START_TIME = '06:00'; // 早上6点
  const DAY_END_TIME = '22:00';   // 晚上10点

  // 拖拽开始
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isCloseButton = target.closest('button');
    
    console.log('🖱️ MouseDown 事件触发:', {
      target: e.target,
      currentTarget: e.currentTarget,
      tagName: target.tagName,
      className: target.className,
      isCloseButton: !!isCloseButton,
      clientX: e.clientX,
      clientY: e.clientY,
      currentDragOffset: dragOffset
    });

    // 检查是否点击在标题区域（排除关闭按钮）
    if (!isCloseButton) {
      e.preventDefault();
      
      const newDragState = {
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        startOffsetX: dragOffset.x,
        startOffsetY: dragOffset.y
      };
      
      dragRef.current = newDragState;
      setIsDragging(true);
      

      // 直接添加事件监听器
      const handleMove = (e: MouseEvent) => {

        if (dragRef.current.isDragging) {
          const newOffset = {
            x: dragRef.current.startOffsetX + (e.clientX - dragRef.current.startX),
            y: dragRef.current.startOffsetY + (e.clientY - dragRef.current.startY)
          };
          
          setDragOffset(newOffset);
        } else {
          console.warn('⚠️ MouseMove 但 isDragging = false');
        }
      };

      const handleUp = () => {
        
        dragRef.current.isDragging = false;
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
        
      };

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
      
    } else {
      console.log('❌ 拖拽条件不满足，忽略事件');
    }
  };

  // 添加ESC键关闭功能
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // 动画控制
  useEffect(() => {
    
    if (isOpen) {
      // 重置拖拽偏移量
      setDragOffset({ x: 0, y: 0 });
      setIsDragging(false);
      dragRef.current = {
        isDragging: false,
        startX: 0,
        startY: 0,
        startOffsetX: 0,
        startOffsetY: 0
      };
      setShouldShow(true);
      setTimeout(() => {
        setIsAnimating(true);
      }, 10);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldShow(false);
        onAnimationComplete?.();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onAnimationComplete]);

    // 自动填充选中的时间范围
  useEffect(() => {

    if (selectedTimeRange && isOpen) {
      const startTimeStr = moment(selectedTimeRange.start).format('HH:mm');
      const endTimeStr = moment(selectedTimeRange.end).format('HH:mm');
      
      setStartTime(startTimeStr);
      setEndTime(endTimeStr);
      
    }
     }, [selectedTimeRange, isOpen, selectedDate]);

  // 计算开始时间的限制
  const getStartTimeConstraints = useCallback(() => {
    return {
      minTime: DAY_START_TIME,
      maxTime: endTime < DAY_END_TIME ? endTime : DAY_END_TIME
    };
  }, [endTime]);

  // 计算结束时间的限制  
  const getEndTimeConstraints = useCallback(() => {
    return {
      minTime: startTime > DAY_START_TIME ? startTime : DAY_START_TIME,
      maxTime: DAY_END_TIME
    };
  }, [startTime]);

  // 更新时间范围并通知父组件
  const updateTimeRange = useCallback((newStartTime: string, newEndTime: string) => {


    if (!selectedDate) {
      console.warn('❌ selectedDate 为空，无法更新时间范围');
      return;
    }

    if (!onTimeRangeChange) {
      console.warn('❌ onTimeRangeChange 回调函数不存在');
      return;
    }

    try {
      const [startHour, startMin] = newStartTime.split(':').map(Number);
      const [endHour, endMin] = newEndTime.split(':').map(Number);
      
      const start = new Date(selectedDate);
      start.setHours(startHour, startMin, 0, 0);
      
      const end = new Date(selectedDate);
      end.setHours(endHour, endMin, 0, 0);



      // 确保结束时间晚于开始时间
      if (end > start) {
        onTimeRangeChange({ start, end });
        console.log('✅ 时间范围已更新并通知父组件');
      } else {
        console.warn('⚠️ 结束时间不晚于开始时间，跳过更新');
      }
    } catch (error) {
      console.error('❌ 时间范围更新失败:', error);
    }
  }, [selectedDate, onTimeRangeChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !selectedDate) return;

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const start = new Date(selectedDate);
    start.setHours(startHour, startMin, 0, 0);
    
    const end = new Date(selectedDate);
    end.setHours(endHour, endMin, 0, 0);

    onSave({
      title,
      start,
      end,
      type: eventType,
      description,
      teacherId: 'teacher1',
      teacherName: '张老师'
    });

    // 重置表单
    setTitle('');
    setStartTime('09:00');
    setEndTime('09:15');
    setEventType('lesson');
    setDescription('');
    
    // 触发关闭动画
    onClose();
  };

  if (!shouldShow) return null;

  // 基于DOM的智能模态框定位和尺寸计算
  const calculateModalProps = () => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    const modalWidth = 384; // w-96 = 384px
    const margin = 16; // 安全边距
    const estimatedContentHeight = 480; // 预估内容高度（紧凑版）
    const headerHeight = 50; // 标题区域高度（紧凑版）
    const footerHeight = 70; // 按钮区域高度（紧凑版）
    
    let modalStyle: React.CSSProperties = {};
    let modalClassName = "bg-white rounded-lg shadow-2xl border border-gray-200";
    let needsScroll = false;
    let contentMaxHeight: number | undefined;
    
    // 计算最大可用高度
    const maxAvailableHeight = screenHeight - 2 * margin;
    
    // 确定最终的模态框高度
    let modalHeight: number;
    if (estimatedContentHeight > maxAvailableHeight) {
      modalHeight = maxAvailableHeight;
      needsScroll = true;
      contentMaxHeight = modalHeight - headerHeight - footerHeight;
    } else {
      modalHeight = estimatedContentHeight;
      needsScroll = false;
    }
    
    // ===== 基于DOM元素实际位置的智能定位 =====
    let adjustedX: number;
    let adjustedY: number;
    let finalSlideDirection: 'left' | 'right' | 'center' = 'right';
    
    // 1. 尝试找到虚拟选中事件的DOM元素
    const selectedEventElement = document.querySelector('[class*="rbc-event"][style*="rgb(216, 27, 96)"]') as HTMLElement;
    
    if (selectedEventElement) {
      // 找到了选中事件的DOM元素，获取其在视口中的实际位置
      const rect = selectedEventElement.getBoundingClientRect();
      
      // === 水平位置计算 ===
      const leftSpace = rect.left;
      const rightSpace = screenWidth - rect.right;
      const modalNeedsSpace = modalWidth + margin;
      
      if (rightSpace >= modalNeedsSpace) {
        // 右侧空间充足，从选中区域右边缘开始，向右偏移20px
        adjustedX = rect.right + 20;
        finalSlideDirection = 'right';
      } else if (leftSpace >= modalNeedsSpace) {
        // 左侧空间充足，模态框右边缘距离选中区域左边缘20px
        adjustedX = rect.left - modalWidth - 20;
        finalSlideDirection = 'left';
      } else {
        // 左右空间都不够，居中显示
        adjustedX = Math.max(margin, (screenWidth - modalWidth) / 2);
        finalSlideDirection = 'center';
      }
      
      // 确保水平位置在安全范围内
      adjustedX = Math.max(margin, Math.min(adjustedX, screenWidth - modalWidth - margin));
      
      // === 垂直位置计算 ===
      const selectionCenterY = rect.top + rect.height / 2;
      const modalCenterY = modalHeight / 2;
      
      // 尝试让模态框中心与选中区域中心对齐
      const idealY = selectionCenterY - modalCenterY;
      
      // 检查垂直空间
      const spaceAbove = rect.top;
      const spaceBelow = screenHeight - rect.bottom;
      
      if (idealY >= margin && idealY + modalHeight <= screenHeight - margin) {
        // 理想位置可行，居中对齐
        adjustedY = idealY;
      } else if (spaceBelow >= modalHeight + 20) {
        // 下方空间充足
        adjustedY = Math.min(rect.bottom + 10, screenHeight - modalHeight - margin);
      } else if (spaceAbove >= modalHeight + 20) {
        // 上方空间充足
        adjustedY = Math.max(margin, rect.top - modalHeight - 10);
      } else {
        // 空间不足，智能调整
        if (selectionCenterY < screenHeight / 2) {
          // 选中区域在屏幕上半部分，模态框偏下显示
          adjustedY = Math.max(
            margin,
            Math.min(
              selectionCenterY + 50,
              screenHeight - modalHeight - margin
            )
          );
        } else {
          // 选中区域在屏幕下半部分，模态框偏上显示
          adjustedY = Math.max(
            margin,
            Math.min(
              selectionCenterY - modalHeight - 50,
              screenHeight - modalHeight - margin
            )
          );
        }
      }
      
    } else if (position) {
      // 没找到DOM元素，回退到传入的位置参数
      
      const { x, y, slideDirection = 'right' } = position;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      const viewportX = x - scrollLeft;
      const viewportY = y - scrollTop;
      
      // 水平位置调整
      adjustedX = Math.min(
        Math.max(margin, viewportX), 
        screenWidth - modalWidth - margin
      );
      
      // ===== 重新设计的垂直位置逻辑 =====
      finalSlideDirection = slideDirection;
      
      // 检查选中区域是否在当前视口范围内
      const isSelectionVisible = viewportY >= -50 && viewportY <= screenHeight + 50;
      
      if (isSelectionVisible) {
        // 选中区域在视口内，尝试贴近选中区域
        const idealBelowY = Math.max(margin, viewportY + 10);
        const idealAboveY = Math.max(margin, viewportY - modalHeight - 10);
        
        // 检查空间
        const spaceBelow = screenHeight - idealBelowY - modalHeight;
        const spaceAbove = idealAboveY - margin;
        
        if (spaceBelow >= 0) {
          // 下方有空间
          adjustedY = idealBelowY;
          finalSlideDirection = slideDirection;
        } else if (spaceAbove >= 0) {
          // 上方有空间
          adjustedY = idealAboveY;
          finalSlideDirection = slideDirection;
        } else {
          // 空间不足，智能调整到最佳位置
          if (viewportY < screenHeight / 2) {
            // 选中区域在屏幕上半部分，模态框放下方
            adjustedY = Math.min(
              screenHeight - modalHeight - margin,
              Math.max(margin, viewportY + 20)
            );
          } else {
            // 选中区域在屏幕下半部分，模态框放上方
            adjustedY = Math.max(
              margin,
              Math.min(viewportY - modalHeight - 20, screenHeight - modalHeight - margin)
            );
          }
          finalSlideDirection = slideDirection;
        }
      } else {
        // 选中区域不在当前视口内，智能选择位置
        if (viewportY < -50) {
          // 选中区域在视口上方（用户向下滚动了很多）
          // 模态框显示在屏幕下半部分
          adjustedY = Math.max(
            margin,
            screenHeight * 0.6 - modalHeight / 2
          );
          finalSlideDirection = 'center';
        } else {
          // 选中区域在视口下方（用户向上滚动了很多）
          // 模态框显示在屏幕上半部分
          adjustedY = Math.min(
            screenHeight - modalHeight - margin,
            screenHeight * 0.4 - modalHeight / 2
          );
          finalSlideDirection = 'center';
        }
      }
      
    } else {
      // 默认居中显示
      adjustedX = (screenWidth - modalWidth) / 2;
      adjustedY = Math.max(margin, (screenHeight - modalHeight) / 2);
      finalSlideDirection = 'center';
    }
    
    // 最终边界检查
    adjustedX = Math.max(margin, Math.min(adjustedX, screenWidth - modalWidth - margin));
    adjustedY = Math.max(margin, Math.min(adjustedY, screenHeight - modalHeight - margin));
    
    // 动画变换
    let transform: string;
    if (isAnimating) {
      transform = 'translateX(0) scale(1)';
    } else {
      switch (finalSlideDirection) {
        case 'left':
          transform = 'translateX(50px) scale(0.95)';
          break;
        case 'right':
          transform = 'translateX(-50px) scale(0.95)';
          break;
        case 'center':
        default:
          transform = 'translateY(-20px) scale(0.95)';
          break;
      }
    }
    
    modalStyle = {
      position: 'fixed',
      left: `${adjustedX}px`,
      top: `${adjustedY}px`,
      height: `${modalHeight}px`,
      width: `${modalWidth}px`,
      maxWidth: 'calc(100vw - 2rem)',
      zIndex: 1000,
      transform,
      opacity: isAnimating ? 1 : 0,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    };
    
    return { modalStyle, modalClassName, needsScroll, contentMaxHeight };
  };
  
  const { modalStyle, modalClassName, needsScroll, contentMaxHeight } = calculateModalProps();

  // 合并拖拽偏移到模态框样式
  const baseTransform = modalStyle.transform?.replace(/translate[XY]?\([^)]*\)/g, '') || '';
  const dragTransform = `translate(${dragOffset.x}px, ${dragOffset.y}px)`;
  const finalTransform = `${dragTransform} ${baseTransform}`.trim();
  
  const finalModalStyle = {
    ...modalStyle,
    transform: finalTransform,
    // 拖拽时禁用 transition 以获得即时响应
    transition: isDragging ? 'none' : modalStyle.transition
  };

  return (
    <>
      {/* 背景遮罩 - 纯视觉效果，不拦截事件 */}
      <div 
        className="fixed inset-0 z-50 pointer-events-none"
        style={{ 
          background: 'rgba(0, 0, 0, 0.1)',
          opacity: isAnimating ? 0.5 : 0,
          transition: 'opacity 0.3s ease-in-out'
        }}
      />
      
      {/* 模态框 - 直接定位，不阻止底层滚动 */}
      <div 
        style={finalModalStyle}
        className={modalClassName}
      >
        {/* 统一的3段式布局：固定头部 + 可滚动内容 + 固定底部 */}
        <div className="flex flex-col h-full overflow-hidden">
          {/* 固定标题区域 - 可拖拽 */}
          <div 
            className="flex-shrink-0 px-4 py-3 border-b border-gray-100 bg-white rounded-t-lg cursor-move"
            onMouseDown={handleMouseDown}
            style={{ userSelect: 'none' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">添加课程安排</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                title="关闭 (ESC)"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* 可滚动内容区域 */}
          <div className="flex-1 overflow-y-auto min-h-0 bg-white">
            <div className="p-4">
              <div className="space-y-3">
               

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    选择日期
                  </label>
                  <input
                    type="text"
                    value={selectedDate ? moment(selectedDate).format('YYYY-MM-DD') : ''}
                    readOnly
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    标题
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入课程标题"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    类型
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="lesson">课程</option>
                    <option value="available">确认可用时段</option>
                    <option value="unavailable">不可用时段</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <TimePicker
                    label="开始时间"
                    value={startTime}
                    onChange={(newStartTime) => {
                      setStartTime(newStartTime);
                      
                      // 如果新的开始时间晚于当前结束时间，自动调整结束时间
                      if (newStartTime >= endTime) {
                        // 找到开始时间后的下一个15分钟间隔作为结束时间
                        const [hours, minutes] = newStartTime.split(':').map(Number);
                        const nextMinutes = minutes + 15;
                        const nextHours = nextMinutes >= 60 ? hours + 1 : hours;
                        const adjustedMinutes = nextMinutes >= 60 ? nextMinutes - 60 : nextMinutes;
                        
                        const newEndTime = `${nextHours.toString().padStart(2, '0')}:${adjustedMinutes.toString().padStart(2, '0')}`;
                        
                        // 确保新的结束时间不超过当天的最晚时间
                        const finalEndTime = newEndTime <= DAY_END_TIME ? newEndTime : DAY_END_TIME;
                        setEndTime(finalEndTime);
                        updateTimeRange(newStartTime, finalEndTime);
                      } else {
                        updateTimeRange(newStartTime, endTime);
                      }
                    }}
                    {...getStartTimeConstraints()}
                  />
                  <TimePicker
                    label="结束时间"
                    value={endTime}
                    onChange={(newEndTime) => {
                      setEndTime(newEndTime);
                      
                      // 如果新的结束时间早于当前开始时间，自动调整开始时间
                      if (newEndTime <= startTime) {
                        // 找到结束时间前的上一个15分钟间隔作为开始时间
                        const [hours, minutes] = newEndTime.split(':').map(Number);
                        const prevMinutes = minutes - 15;
                        const prevHours = prevMinutes < 0 ? hours - 1 : hours;
                        const adjustedMinutes = prevMinutes < 0 ? prevMinutes + 60 : prevMinutes;
                        
                        const newStartTime = `${prevHours.toString().padStart(2, '0')}:${adjustedMinutes.toString().padStart(2, '0')}`;
                        
                        // 确保新的开始时间不早于当天的最早时间
                        const finalStartTime = newStartTime >= DAY_START_TIME ? newStartTime : DAY_START_TIME;
                        setStartTime(finalStartTime);
                        updateTimeRange(finalStartTime, newEndTime);
                        
                      } else {
                        updateTimeRange(startTime, newEndTime);
                      }
                    }}
                    {...getEndTimeConstraints()}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    描述（可选）
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                    placeholder="请输入课程描述"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* 固定底部按钮区域 */}
          <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 bg-white rounded-b-lg">
            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                取消
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                disabled={!title || !selectedDate}
              >
                保存
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 