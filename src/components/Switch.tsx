import React from 'react';
import * as Switch from '@radix-ui/react-switch';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function CustomSwitch({ 
  checked, 
  onCheckedChange, 
  label, 
  description, 
  disabled = false,
  size = 'md'
}: SwitchProps) {
  const sizeClasses = {
    sm: {
      root: 'w-8 h-4',
      thumb: 'w-3 h-3 data-[state=checked]:translate-x-4'
    },
    md: {
      root: 'w-11 h-6',
      thumb: 'w-5 h-5 data-[state=checked]:translate-x-5'
    },
    lg: {
      root: 'w-14 h-8',
      thumb: 'w-6 h-6 data-[state=checked]:translate-x-6'
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className="flex items-center space-x-3">
      <Switch.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={`${currentSize.root} bg-gray-200 rounded-full relative shadow-sm outline-none cursor-pointer transition-colors
          data-[state=checked]:bg-blue-500 
          data-[state=unchecked]:bg-gray-200
          disabled:cursor-not-allowed disabled:opacity-50
          focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
      >
        <Switch.Thumb 
          className={`${currentSize.thumb} bg-white rounded-full shadow-md transform transition-transform
            data-[state=unchecked]:translate-x-0.5`}
        />
      </Switch.Root>
      
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <label className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
              {label}
            </label>
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