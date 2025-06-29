import React, { useState, useRef, useEffect } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { ClockIcon } from '@heroicons/react/24/outline';

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  minTime?: string; // 最早时间 (HH:mm)
  maxTime?: string; // 最晚时间 (HH:mm)
  disabled?: boolean;
}

export default function TimePicker({ 
  value, 
  onChange, 
  label, 
  placeholder = "选择时间",
  minTime,
  maxTime,
  disabled = false
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedItemRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  // 将时间字符串转换为分钟数（用于比较）
  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // 生成时间选项并应用过滤
  const generateTimeOptions = () => {
    const options = [];
    const minMinutes = minTime ? timeToMinutes(minTime) : 0;
    const maxMinutes = maxTime ? timeToMinutes(maxTime) : 24 * 60 - 1;

    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const currentMinutes = timeToMinutes(timeString);
        
        // 只包含在时间范围内的选项
        if (currentMinutes >= minMinutes && currentMinutes <= maxMinutes) {
          options.push(timeString);
        }
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // 当下拉菜单打开时，滚动到选中的项目
  useEffect(() => {
    if (open && value) {
      // 使用setTimeout确保DOM完全渲染后再执行滚动
      const scrollTimer = setTimeout(() => {
        const container = scrollContainerRef.current;
        const selectedItem = selectedItemRefs.current[value];
        
        if (container && selectedItem) {
          // 计算项目在容器中的相对位置
          const itemOffsetTop = selectedItem.offsetTop;
          const itemHeight = selectedItem.offsetHeight;
          const containerHeight = container.clientHeight;
          
          // 计算理想的滚动位置（让选中项在容器中央偏上一点）
          const idealScrollTop = itemOffsetTop - (containerHeight / 3) + (itemHeight / 2);
          
          // 平滑滚动到目标位置
          container.scrollTo({
            top: Math.max(0, idealScrollTop),
            behavior: 'smooth'
          });
          
          console.log('🎯 TimePicker 自动滚动到选中项:', {
            value,
            itemOffsetTop,
            idealScrollTop,
            containerHeight
          });
        }
      }, 50); // 延迟50ms确保渲染完成
      
      return () => clearTimeout(scrollTimer);
    }
  }, [open, value]);

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-xs font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            disabled={disabled || timeOptions.length === 0}
            className={`w-full px-3 py-1.5 text-sm border rounded-md text-left transition-colors ${
              disabled || timeOptions.length === 0
                ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={
                disabled || timeOptions.length === 0
                  ? "text-gray-400"
                  : value 
                    ? "text-gray-900" 
                    : "text-gray-500"
              }>
                {timeOptions.length === 0 
                  ? "无可选时间"
                  : value || placeholder
                }
              </span>
              <ClockIcon className={`h-4 w-4 ${
                disabled || timeOptions.length === 0 ? 'text-gray-300' : 'text-gray-400'
              }`} />
            </div>
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            ref={scrollContainerRef}
            className="w-56 bg-white rounded-lg shadow-lg border border-gray-200 p-2 max-h-60 overflow-y-auto"
            sideOffset={5}
            style={{ zIndex: 1100 }}
          >
            <div className="grid gap-1">
              {timeOptions.length > 0 ? (
                timeOptions.map((time) => (
                  <button
                    key={time}
                    ref={(el) => {
                      selectedItemRefs.current[time] = el;
                    }}
                    type="button"
                    onClick={() => {
                      console.log('🕐 TimePicker 时间选择:', time);
                      onChange(time);
                      setOpen(false);
                    }}
                    className={`px-3 py-2 text-sm rounded-md text-left hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                      value === time
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-700'
                    }`}
                  >
                    {time}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-400 text-center">
                  当前时间范围内无可选项
                  {minTime && maxTime && (
                    <div className="text-xs mt-1">
                      可选范围: {minTime} - {maxTime}
                    </div>
                  )}
                </div>
              )}
            </div>
            <Popover.Arrow className="fill-white" />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
} 