import React from 'react';
import * as Checkbox from '@radix-ui/react-checkbox';
import * as Label from '@radix-ui/react-label';
import { CheckIcon } from '@heroicons/react/24/outline';

interface CheckBoxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  id?: string;
}

export default function CheckBox({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  size = 'md',
  id
}: CheckBoxProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="flex items-start space-x-3">
      <Checkbox.Root
        id={checkboxId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={`
          ${sizeClasses[size]} 
          flex items-center justify-center
          border-2 border-gray-300 rounded-md
          bg-white shadow-sm
          transition-all duration-200
          hover:border-blue-400
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
          cursor-pointer
        `}
      >
        <Checkbox.Indicator className="text-white">
          <CheckIcon className={iconSizeClasses[size]} />
        </Checkbox.Indicator>
      </Checkbox.Root>

      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <Label.Root
              htmlFor={checkboxId}
              className={`text-sm font-medium cursor-pointer ${
                disabled ? 'text-gray-400' : 'text-gray-700'
              }`}
            >
              {label}
            </Label.Root>
          )}
          {description && (
            <span className={`text-xs ${disabled ? 'text-gray-300' : 'text-gray-500'}`}>
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
} 