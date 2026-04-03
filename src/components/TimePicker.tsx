import React, { useState, useRef, useEffect } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  minTime?: string; // 最早时间 (HH:mm)
  maxTime?: string; // 最晚时间 (HH:mm)
  disabled?: boolean;
}

/** 将 HH:mm 约束在 [minTime, maxTime]（分钟级） */
function clampTime(timeStr: string, minTime?: string, maxTime?: string): string {
  const timeToMinutes = (t: string): number => {
    const [hours, minutes] = t.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
    return hours * 60 + minutes;
  };
  let m = timeToMinutes(timeStr);
  if (minTime != null) m = Math.max(m, timeToMinutes(minTime));
  if (maxTime != null) m = Math.min(m, timeToMinutes(maxTime));
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
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
    // 只有当弹出框打开时才滚动，移除value依赖避免无限循环
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
        }
      }, 100); // 增加延迟确保渲染完成
      
      return () => clearTimeout(scrollTimer);
    }
  }, [open]); // 只依赖open状态，移除value依赖

  const handleManualChange = (raw: string) => {
    if (!raw) return;
    onChange(clampTime(raw, minTime, maxTime));
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-xs font-medium text-gray-700">
          {label}
        </label>
      )}

      <div className="flex gap-1 items-stretch">
        <input
          type="time"
          step={60}
          value={value || ''}
          min={minTime}
          max={maxTime}
          disabled={disabled}
          onChange={(e) => handleManualChange(e.target.value)}
          aria-label={label || placeholder}
          title="可输入任意分钟（如 10:20）；右侧为 15 分钟快捷列表"
          className={`flex-1 min-w-0 px-2 py-1.5 text-sm border rounded-md ${
            disabled
              ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          }`}
        />

        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild>
            <button
              type="button"
              disabled={disabled || timeOptions.length === 0}
              title="快捷选择（15 分钟间隔）"
              className={`shrink-0 px-2 border rounded-md transition-colors ${
                disabled || timeOptions.length === 0
                  ? 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed'
                  : 'bg-white border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
              }`}
            >
              <ChevronDownIcon className="h-5 w-5" aria-hidden />
            </button>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Content
              ref={scrollContainerRef}
              className="w-56 bg-white rounded-lg shadow-lg border border-gray-200 p-2 max-h-60 overflow-y-auto"
              sideOffset={5}
              style={{ zIndex: 1100 }}
            >
              <div className="grid gap-1 staff-time-picker-content">
                {timeOptions.length > 0 ? (
                  timeOptions.map((time) => (
                    <button
                      key={time}
                      ref={(el) => {
                        selectedItemRefs.current[time] = el;
                      }}
                      type="button"
                      onClick={() => {
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
                    当前时间范围内无快捷项，请用左侧手动输入
                    {minTime && maxTime && (
                      <div className="text-xs mt-1">
                        范围: {minTime} - {maxTime}
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
    </div>
  );
} 