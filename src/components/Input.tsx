import React, { forwardRef } from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helpText?: string;
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helpText,
  size = 'md',
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  const baseClasses = 'w-full border border-gray-300 rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed';

  const errorClasses = error 
    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
    : '';

  const inputClasses = [
    baseClasses,
    sizeClasses[size],
    errorClasses,
    leftIcon ? 'pl-10' : '',
    rightIcon ? 'pr-10' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">{leftIcon}</span>
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-400">{rightIcon}</span>
          </div>
        )}
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

Input.displayName = 'Input';

export default Input; 