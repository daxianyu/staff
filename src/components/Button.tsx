'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children?: ReactNode;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

function ButtonComponent({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  disabled,
  className = '',
  icon,
  iconPosition = 'left',
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 border border-transparent',
    outline: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500',
  };

  const classes = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

  // 对于 primary 按钮，使用内联样式确保主题颜色生效
  const primaryStyle = variant === 'primary' ? {
    backgroundColor: 'var(--button-primary-bg)',
    color: 'var(--button-primary-text)',
  } : undefined;

  // 添加 hover 样式处理
  const handleMouseEnter = variant === 'primary' ? (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      e.currentTarget.style.backgroundColor = 'var(--button-primary-hover)';
    }
  } : undefined;

  const handleMouseLeave = variant === 'primary' ? (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      e.currentTarget.style.backgroundColor = 'var(--button-primary-bg)';
    }
  } : undefined;

  // 渲染图标和内容
  const renderContent = () => {
    if (loading) {
      return (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
          <span>加载中...</span>
        </>
      );
    }

    if (!children && icon) {
      // 只有图标，没有文字
      return icon;
    }

    if (icon && children) {
      // 有图标和文字
      if (iconPosition === 'right') {
        return (
          <>
            {children}
            <span className="ml-2">{icon}</span>
          </>
        );
      } else {
        return (
          <>
            <span className="mr-2">{icon}</span>
            {children}
          </>
        );
      }
    }

    return children;
  };

  return (
    <button
      className={classes}
      style={primaryStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={disabled || loading}
      {...props}
    >
      {renderContent()}
    </button>
  );
}

// 命名导出
export { ButtonComponent as Button };

// 默认导出
export default ButtonComponent;
