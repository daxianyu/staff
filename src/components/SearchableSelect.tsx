'use client';

import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Command } from 'cmdk';
import { ChevronDownIcon, CheckIcon } from '@radix-ui/react-icons';

interface Option {
  id: number;
  name: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: number | number[];
  onValueChange: (value: number | number[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  multiple?: boolean;
}

export default function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "请选择...",
  searchPlaceholder = "搜索...",
  className = "",
  disabled = false,
  multiple = false
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  // 当前选中项
  const selectedOptions = multiple 
    ? options.filter(option => (value as number[]).includes(option.id))
    : options.find(option => option.id === value);

  // 处理选择
  const handleSelect = (selectedValue: string) => {
    const selectedId = Number(selectedValue);
    
    if (multiple) {
      const currentValues = value as number[];
      const newValues = currentValues.includes(selectedId)
        ? currentValues.filter(id => id !== selectedId)
        : [...currentValues, selectedId];
      onValueChange(newValues);
    } else {
      onValueChange(selectedId);
      setIsOpen(false);
    }
  };

  // 移除多选中的项目
  const removeSelected = (idToRemove: number) => {
    if (multiple) {
      const currentValues = value as number[];
      const newValues = currentValues.filter(id => id !== idToRemove);
      onValueChange(newValues);
    }
  };

  // 显示文本
  const getDisplayText = () => {
    if (multiple) {
      const selected = selectedOptions as Option[];
      if (selected.length === 0) return placeholder;
      if (selected.length === 1) return selected[0].name;
      return `${selected.length} 项已选择`;
    } else {
      return (selectedOptions as Option)?.name || placeholder;
    }
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
            {multiple && (selectedOptions as Option[]).length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {(selectedOptions as Option[]).map(option => (
                  <span
                    key={option.id}
                    className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md"
                  >
                    {option.name}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSelected(option.id);
                      }}
                      className="ml-1 hover:text-blue-600"
                    >
                      <CheckIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <span className="truncate">{getDisplayText()}</span>
            )}
          </div>
          <ChevronDownIcon className="h-4 w-4 ml-2 flex-shrink-0" />
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
          <Command className="w-full">
            <Command.Input
              placeholder={searchPlaceholder}
              className="w-full px-3 py-2 text-sm border-b border-gray-200 focus:outline-none bg-transparent"
              autoFocus
            />
            <Command.List className="max-h-64 overflow-auto p-1">
              <Command.Empty className="px-3 py-2 text-sm text-gray-500 text-center">
                没有找到匹配项
              </Command.Empty>
              {options.map((option) => {
                const isSelected = multiple 
                  ? (value as number[]).includes(option.id)
                  : option.id === value;
                
                return (
                  <Command.Item
                    key={option.id}
                    value={`${option.id} ${option.name}`}
                    onSelect={() => handleSelect(option.id.toString())}
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
