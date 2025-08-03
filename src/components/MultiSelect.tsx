import React, { useState } from 'react';
import * as Select from '@radix-ui/react-select';
import { ChevronDownIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  maxDisplay?: number; // 最多显示的选中项数量
}

export default function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "选择选项...",
  label,
  disabled = false,
  className = "",
  maxDisplay = 3
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (selectedValue: string) => {
    if (disabled) return;
    
    const newValue = value.includes(selectedValue)
      ? value.filter(v => v !== selectedValue)
      : [...value, selectedValue];
    
    onChange(newValue);
  };

  const handleRemove = (removeValue: string) => {
    if (disabled) return;
    onChange(value.filter(v => v !== removeValue));
  };

  const selectedOptions = options.filter(option => value.includes(option.value));
  const displayCount = Math.min(selectedOptions.length, maxDisplay);
  const hasMore = selectedOptions.length > maxDisplay;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <Select.Root open={open} onOpenChange={setOpen} disabled={disabled}>
        <Select.Trigger
          className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed ${open ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
        >
          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
            {selectedOptions.length > 0 ? (
              <>
                {selectedOptions.slice(0, displayCount).map((option) => (
                  <span
                    key={option.value}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                  >
                    <span className="truncate">{option.label}</span>
                    {!disabled && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(option.value);
                        }}
                        className="hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
                {hasMore && (
                  <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                    +{selectedOptions.length - maxDisplay}
                  </span>
                )}
              </>
            ) : (
              <span className="text-gray-500 truncate">{placeholder}</span>
            )}
          </div>
          <Select.Icon>
            <ChevronDownIcon className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            className="bg-white rounded-md shadow-lg border border-gray-200 min-w-[200px] max-h-[240px] z-[9999]"
            sideOffset={5}
            side="bottom"
            align="start"
            avoidCollisions={true}
          >
            <Select.Viewport className="p-1 max-h-[240px] overflow-y-auto">
              {options.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <Select.Item
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={`flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 focus:bg-gray-50 outline-none rounded transition-colors ${
                      option.disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'
                    } ${isSelected ? 'bg-blue-50 text-blue-700' : ''}`}
                    onClick={() => handleSelect(option.value)}
                  >
                    <div className="flex items-center w-full">
                      <div className={`w-4 h-4 border rounded mr-3 flex items-center justify-center ${
                        isSelected 
                          ? 'bg-orange-500 border-orange-500' 
                          : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <CheckIcon className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="flex-1">{option.label}</span>
                    </div>
                  </Select.Item>
                );
              })}
            </Select.Viewport>
            <Select.Arrow className="fill-white" />
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
} 