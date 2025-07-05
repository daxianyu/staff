import { useState, useEffect, useCallback, useRef } from 'react';
import moment from 'moment';
import TimePicker from '../../../../components/TimePicker';
import Button from '../../../../components/Button';

interface ScheduleEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  teacherId: string;
  teacherName: string;
  type: 'lesson' | 'unavailable';
  description?: string;
}

interface MobileAddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Partial<ScheduleEvent>) => void;
  selectedDate?: Date;
  selectedTimeRange?: { start: Date; end: Date };
  onAnimationComplete?: () => void;
  onConflictCheck?: (start: Date, end: Date) => Array<{ start: Date; end: Date }>;
}

export default function MobileAddEventModal({ 
  isOpen, 
  onClose, 
  onSave,
  selectedDate,
  selectedTimeRange,
  onAnimationComplete,
  onConflictCheck
}: MobileAddEventModalProps) {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:15');
  const [eventType, setEventType] = useState<'lesson' | 'unavailable'>('lesson');
  const [description, setDescription] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const [currentConflicts, setCurrentConflicts] = useState<Array<{ start: Date; end: Date }>>([]);
  
  // 手势相关状态
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // 时间限制配置
  const DAY_START_TIME = '09:00';
  const DAY_END_TIME = '22:00';

  // ESC键关闭功能
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
      setShouldShow(true);
      // 延迟动画，从底部滑入
      setTimeout(() => setIsAnimating(true), 10);
      
      // 防止背景滚动
      document.body.style.overflow = 'hidden';
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldShow(false);
        onAnimationComplete?.();
        
        // 恢复背景滚动
        document.body.style.overflow = '';
      }, 300);
      return () => clearTimeout(timer);
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, onAnimationComplete]);

  // 下拉手势处理
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setStartY(touch.clientY);
    setCurrentY(touch.clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    setCurrentY(touch.clientY);
    
    // 只允许向下拖拽
    const deltaY = Math.max(0, touch.clientY - startY);
    if (modalRef.current) {
      modalRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const deltaY = currentY - startY;
    setIsDragging(false);
    
    // 如果拖拽距离超过阈值，关闭模态框
    if (deltaY > 100) {
      onClose();
    } else if (modalRef.current) {
      // 否则回弹到原位
      modalRef.current.style.transform = 'translateY(0)';
    }
  };

  // 自动填充选中的时间范围
  useEffect(() => {
    if (selectedTimeRange && isOpen) {
      const startTimeStr = moment(selectedTimeRange.start).format('HH:mm');
      const endTimeStr = moment(selectedTimeRange.end).format('HH:mm');
      
      setStartTime(startTimeStr);
      setEndTime(endTimeStr);
    }
  }, [selectedTimeRange, isOpen]);

  // 时间冲突检查
  useEffect(() => {
    if (!selectedDate || !isOpen || !onConflictCheck) {
      setCurrentConflicts([]);
      return;
    }
    
    const start = moment(selectedDate).set({
      hour: parseInt(startTime.split(':')[0]),
      minute: parseInt(startTime.split(':')[1])
    }).toDate();
    
    const end = moment(selectedDate).set({
      hour: parseInt(endTime.split(':')[0]),
      minute: parseInt(endTime.split(':')[1])
    }).toDate();
    
    const conflicts = onConflictCheck(start, end);
    setCurrentConflicts(conflicts);
  }, [startTime, endTime, selectedDate, isOpen, onConflictCheck]);

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
    
    onClose();
  };

  if (!shouldShow) return null;

  return (
    <>
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 z-50 bg-black/50"
        style={{ 
          opacity: isAnimating ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out'
        }}
        onClick={onClose}
      />
      
      {/* 手机端全屏模态框 */}
      <div 
        ref={modalRef}
        className="fixed inset-x-0 bottom-0 z-50 bg-white"
        style={{
          height: '85vh',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          transform: isAnimating ? 'translateY(0)' : 'translateY(100%)',
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        data-modal="mobile-add-event"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 拖拽指示器 */}
        <div 
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>
        
        {/* 固定头部 */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">添加课程安排</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors active:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* 时间冲突提示 */}
          {currentConflicts && currentConflicts.length > 0 && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-800">
                    时间冲突提示
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    所选时间段与不可用时间段重合：
                    {currentConflicts.map((slot, index) => (
                      <span key={index} className="ml-1 font-medium">
                        {moment(slot.start).format('HH:mm')}-{moment(slot.end).format('HH:mm')}
                        {index < currentConflicts.length - 1 && '，'}
                      </span>
                    ))}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* 可滚动内容区域 */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择日期
              </label>
              <input
                type="text"
                value={selectedDate ? moment(selectedDate).format('YYYY-MM-DD') : ''}
                readOnly
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标题
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入课程标题"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                类型
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as any)}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                style={{
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '16px'
                }}
              >
                <option value="lesson">课程</option>
                <option value="unavailable">不可用时段</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <TimePicker
                label="开始时间"
                value={startTime}
                onChange={(newStartTime) => {
                  setStartTime(newStartTime);
                  
                  if (newStartTime >= endTime) {
                    const [hours, minutes] = newStartTime.split(':').map(Number);
                    const nextMinutes = minutes + 15;
                    const nextHours = nextMinutes >= 60 ? hours + 1 : hours;
                    const adjustedMinutes = nextMinutes >= 60 ? nextMinutes - 60 : nextMinutes;
                    
                    const newEndTime = `${nextHours.toString().padStart(2, '0')}:${adjustedMinutes.toString().padStart(2, '0')}`;
                    const finalEndTime = newEndTime <= DAY_END_TIME ? newEndTime : DAY_END_TIME;
                    setEndTime(finalEndTime);
                  }
                }}
                {...getStartTimeConstraints()}
              />
              <TimePicker
                label="结束时间"
                value={endTime}
                onChange={(newEndTime) => {
                  setEndTime(newEndTime);
                  
                  if (newEndTime <= startTime) {
                    const [hours, minutes] = newEndTime.split(':').map(Number);
                    const prevMinutes = minutes - 15;
                    const prevHours = prevMinutes < 0 ? hours - 1 : hours;
                    const adjustedMinutes = prevMinutes < 0 ? prevMinutes + 60 : prevMinutes;
                    
                    const newStartTime = `${prevHours.toString().padStart(2, '0')}:${adjustedMinutes.toString().padStart(2, '0')}`;
                    const finalStartTime = newStartTime >= DAY_START_TIME ? newStartTime : DAY_START_TIME;
                    setStartTime(finalStartTime);
                  }
                }}
                {...getEndTimeConstraints()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                描述（可选）
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="请输入课程描述"
              />
            </div>
          </form>
        </div>
        
        {/* 固定底部按钮 */}
        <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200 bg-white safe-area-bottom">
          <div className="flex space-x-3">
            <Button
              variant="ghost"
              size="lg"
              onClick={onClose}
              className="flex-1 active:scale-95 transition-transform"
            >
              取消
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleSubmit}
              disabled={!title || !selectedDate}
              className="flex-1 active:scale-95 transition-transform"
            >
              保存
            </Button>
          </div>
        </div>
      </div>
    </>
  );
} 