'use client';

import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Command } from 'cmdk';
import { ChevronDownIcon, CheckIcon } from '@radix-ui/react-icons';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Option<T extends string | number> {
  id: T;
  name: string;
}

/** 面试时间段「HH:MM-HH:MM」：按左右段词头匹配，避免模糊分尾部杂项；整段再按边界包含（如搜 :20） */
function matchesTimeSlotStyleLabel(label: string, searchRaw: string): boolean {
  const q = searchRaw.trim().toLowerCase();
  if (!q) return true;
  const l = label.trim().toLowerCase();
  if (!l) return false;

  const parts = l.split('-').map((p) => p.trim());
  if (parts.some((p) => p.startsWith(q))) return true;

  if (!l.includes(q)) return false;
  let i = 0;
  while ((i = l.indexOf(q, i)) !== -1) {
    if (i === 0 || l[i - 1] === '-' || l[i - 1] === ':') return true;
    i += 1;
  }
  return false;
}

interface SearchableSelectProps<T extends string | number> {
  options: Option<T>[];
  value: T | T[];
  onValueChange: (value: T | T[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  multiple?: boolean;
  onSearch?: (value: string) => void;
  clearable?: boolean;
  /** 多选时最多显示的已选数量，不传或 0 表示全部展示 */
  maxDisplayCount?: number;
  /**
   * 面试时间段等场景：按时段词头/边界匹配，搜 11、12 时减少无关项。
   * 默认 false：整段文案 includes（仍为非模糊二值，去掉 cmdk 弱相关尾部）
   */
  strictTimeLabelSearch?: boolean;
}

export default function SearchableSelect<T extends string | number>({
  options,
  value,
  onValueChange,
  placeholder = "请选择...",
  searchPlaceholder = "搜索...",
  className = "",
  disabled = false,
  multiple = false,
  onSearch,
  clearable = false,
  maxDisplayCount = 3,
  strictTimeLabelSearch = false,
}: SearchableSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  // Helper to compare values
  const isEqual = (a: T, b: T) => a === b;

  const multiValues = multiple
    ? ((Array.isArray(value) ? value : []) as T[])
    : ([] as T[]);

  // 当前选中项
  const selectedOptions = multiple
    ? options.filter((option) => multiValues.includes(option.id))
    : options.find(option => isEqual(option.id, value as T));

  // 处理选择
  const handleSelect = (selectedId: T) => {
    if (multiple) {
      const currentValues = multiValues;
      const exists = currentValues.includes(selectedId);
      const newValues = exists
        ? currentValues.filter(id => !isEqual(id, selectedId))
        : [...currentValues, selectedId];
      onValueChange(newValues);
    } else {
      // 单选模式：如果点击已选中的项，则取消选择（设置为空值）
      const currentValue = value as T;
      if (isEqual(currentValue, selectedId)) {
        // 根据类型设置空值：string 类型为空字符串，number 类型为 -1（表示未选择）
        const emptyValue = (typeof selectedId === 'string' ? '' : -1) as T;
        onValueChange(emptyValue);
      } else {
        onValueChange(selectedId);
      }
      setIsOpen(false);
    }
  };

  // 移除多选中的项目
  const removeSelected = (idToRemove: T) => {
    if (multiple) {
      const currentValues = multiValues;
      const newValues = currentValues.filter(id => !isEqual(id, idToRemove));
      onValueChange(newValues);
    }
  };

  // 显示文本
  const getDisplayText = () => {
    if (multiple) {
      const selected = selectedOptions as Option<T>[];
      if (selected.length === 0) return placeholder;
      if (selected.length === 1) return selected[0].name;
      return `${selected.length} 项已选择`;
    } else {
      return (selectedOptions as Option<T>)?.name || placeholder;
    }
  };

  // 检查是否有值
  const hasValue = multiple
    ? multiValues.length > 0
    : (typeof value === 'string' ? value !== '' : value !== -1);

  // 清除选择
  const doClear = () => {
    if (multiple) {
      onValueChange([] as T[]);
    } else {
      const emptyValue = (typeof value === 'string' ? '' : -1) as T;
      onValueChange(emptyValue);
    }
  };
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    doClear();
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <button
          disabled={disabled}
          className={`
            inline-flex items-center justify-between px-3 py-2 text-sm
            bg-white border border-gray-300 rounded-md
            hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            min-w-[200px] ${className}
          `}
          aria-label={placeholder}
        >
          <div className="flex-1 text-left">
            {multiple && (selectedOptions as Option<T>[]).length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {(() => {
                  const selected = selectedOptions as Option<T>[];
                  const displayOptions = maxDisplayCount > 0
                    ? selected.slice(0, maxDisplayCount)
                    : selected;
                  const remainingCount = maxDisplayCount > 0
                    ? selected.length - maxDisplayCount
                    : 0;

                  return (
                    <>
                      {displayOptions.map(option => (
                        <span
                          key={String(option.id)}
                          className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md"
                        >
                          {option.name}
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSelected(option.id);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                e.stopPropagation();
                                removeSelected(option.id);
                              }
                            }}
                            className="ml-1 hover:text-blue-600 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                          >
                            <CheckIcon className="h-3 w-3" />
                          </span>
                        </span>
                      ))}
                      {remainingCount > 0 && (
                        <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md">
                          +{remainingCount} 更多
                        </span>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              <span className="truncate">{getDisplayText()}</span>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            {clearable && hasValue && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    doClear();
                  }
                }}
                className="p-0.5 hover:bg-gray-200 rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                aria-label="清除选择"
              >
                <XMarkIcon className="h-4 w-4 text-gray-500 hover:text-gray-700" />
              </span>
            )}
            <ChevronDownIcon className="h-4 w-4" />
          </div>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="
            w-[var(--radix-popover-trigger-width)] max-h-96
            bg-white rounded-md shadow-lg border border-gray-200
            data-[state=open]:animate-in data-[state=closed]:animate-out 
            data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
            data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
            data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2
            z-[9999] overflow-hidden
          "
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command
            className="w-full"
            shouldFilter={!onSearch}
            filter={
              onSearch
                ? undefined
                : (_itemValue, search, keywords) => {
                    if (!search.trim()) return 1;
                    const label = keywords?.[0] ?? '';
                    const q = search.trim().toLowerCase();
                    const ok = strictTimeLabelSearch
                      ? matchesTimeSlotStyleLabel(label, search)
                      : label.trim().toLowerCase().includes(q);
                    return ok ? 1 : 0;
                  }
            }
          >
            <Command.Input
              placeholder={searchPlaceholder}
              className="w-full px-3 py-2 text-sm border-b border-gray-200 focus:outline-none bg-transparent"
              autoFocus
              onValueChange={onSearch}
            />
            <Command.List className="max-h-64 overflow-auto p-1">
              <Command.Empty className="px-3 py-2 text-sm text-gray-500 text-center">
                没有找到匹配项
              </Command.Empty>
              {options.map((option) => {
                const isSelected = multiple
                  ? multiValues.includes(option.id)
                  : isEqual(option.id, value as T);
                /** cmdk 用 value 做 data-value 与 onSelect 入参；用稳定 id，展示与搜索走 keywords（见 cmdk 文档） */
                const itemValue = String(option.id);
                /** 只传完整展示文案；过滤在 filter 内二值处理，不用 cmdk 模糊分 */
                const itemKeywords = [option.name];

                return (
                  <Command.Item
                    key={String(option.id)}
                    value={itemValue}
                    keywords={itemKeywords}
                    onSelect={(selectedValue) => {
                      const hit = options.find((o) => String(o.id) === selectedValue);
                      if (hit) handleSelect(hit.id);
                    }}
                    className="
                      relative flex items-center px-3 py-2 text-sm select-none cursor-pointer rounded
                      data-[selected]:bg-blue-50 data-[selected]:text-blue-900
                      hover:bg-gray-50
                    "
                  >
                    <span>{option.name}</span>
                    {isSelected && (
                      <CheckIcon className="h-4 w-4 ml-auto" />
                    )}
                  </Command.Item>
                );
              })}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
