import React, { forwardRef, useState } from 'react';
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
  label?: string;
  error?: string;
  helpText?: string;
  size?: 'sm' | 'md' | 'lg';
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  value?: number;
  defaultValue?: number;
}

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(({
  label,
  error,
  helpText,
  size = 'md',
  min = 1,
  max = 100,
  step = 1,
  onChange,
  value,
  defaultValue = 1,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `number-input-${Math.random().toString(36).substr(2, 9)}`;
  const [inputValue, setInputValue] = useState<number>(value ?? defaultValue);

  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  const buttonSizeClasses = {
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2'
  };

  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const baseClasses = 'w-full border border-gray-300 rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed text-center';

  const errorClasses = error 
    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
    : '';

  const inputClasses = [
    baseClasses,
    sizeClasses[size],
    errorClasses,
    className
  ].filter(Boolean).join(' ');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || min;
    const clampedValue = Math.max(min, Math.min(max, newValue));
    setInputValue(clampedValue);
    onChange?.(clampedValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, inputValue + step);
    setInputValue(newValue);
    onChange?.(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(min, inputValue - step);
    setInputValue(newValue);
    onChange?.(newValue);
  };

  // 同步外部value变化
  React.useEffect(() => {
    if (value !== undefined) {
      setInputValue(value);
    }
  }, [value]);

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={inputValue <= min}
          className={`flex items-center justify-center border border-gray-300 rounded-l-md bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors ${buttonSizeClasses[size]}`}
        >
          <MinusIcon className={`text-gray-600 ${iconSizeClasses[size]}`} />
        </button>
        
        <input
          ref={ref}
          id={inputId}
          type="number"
          min={min}
          max={max}
          step={step}
          value={inputValue}
          onChange={handleInputChange}
          className={inputClasses}
          {...props}
        />
        
        <button
          type="button"
          onClick={handleIncrement}
          disabled={inputValue >= max}
          className={`flex items-center justify-center border border-gray-300 rounded-r-md bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors ${buttonSizeClasses[size]}`}
        >
          <PlusIcon className={`text-gray-600 ${iconSizeClasses[size]}`} />
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
      {helpText && !error && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}
    </div>
  );
});

NumberInput.displayName = 'NumberInput';

export default NumberInput; 