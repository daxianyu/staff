'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

// 通知类型
export type NotifyType = 'success' | 'warning' | 'error' | 'info';

// 单个通知的接口
export interface NotifyItem {
  id: string;
  message: string;
  type: NotifyType;
  duration: number;
}

// 通知上下文接口
interface NotifyContextProps {
  notifications: NotifyItem[];
  notify: (message: string, type?: NotifyType, duration?: number) => void;
  removeNotification: (id: string) => void;
}

// 创建通知上下文
const NotifyContext = createContext<NotifyContextProps | undefined>(undefined);

// 通知提供者组件
export function NotifyProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotifyItem[]>([]);

  // 移除通知
  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  // 添加通知
  const notify = useCallback((message: string, type: NotifyType = 'info', duration: number = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification = { id, message, type, duration };
    
    setNotifications((prev) => [...prev, newNotification]);
    
    // 设置自动移除
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  }, [removeNotification]);

  return (
    <NotifyContext.Provider value={{ notifications, notify, removeNotification }}>
      {children}
      <NotifyContainer />
    </NotifyContext.Provider>
  );
}

// 使用通知的钩子
export function useNotify() {
  const context = useContext(NotifyContext);
  
  if (context === undefined) {
    throw new Error('useNotify must be used within a NotifyProvider');
  }
  
  return context;
}

// 通知容器组件
function NotifyContainer() {
  const { notifications, removeNotification } = useNotify();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {notifications.map((notification) => (
        <NotifyItem 
          key={notification.id} 
          notification={notification} 
          onClose={() => removeNotification(notification.id)} 
        />
      ))}
    </div>
  );
}

// 单个通知项组件
function NotifyItem({ notification, onClose }: { notification: NotifyItem; onClose: () => void }) {
  const [isExiting, setIsExiting] = useState(false);
  
  // 处理关闭动画
  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300); // 动画持续时间
  };

  useEffect(() => {
    if (notification.duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(onClose, 300);
      }, notification.duration - 300);
      
      return () => clearTimeout(timer);
    }
  }, [notification.duration, onClose]);

  // 根据类型确定样式
  const getTypeStyles = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-100 border-green-500 text-green-700';
      case 'warning':
        return 'bg-yellow-100 border-yellow-500 text-yellow-700';
      case 'error':
        return 'bg-red-100 border-red-500 text-red-700';
      default:
        return 'bg-blue-100 border-blue-500 text-blue-700';
    }
  };

  return (
    <div 
      className={`relative p-4 rounded-md shadow-md border-l-4 min-w-[280px] transform transition-all duration-300 ${getTypeStyles()} ${
        isExiting ? 'opacity-0 translate-x-full' : 'opacity-100'
      }`}
    >
      <button 
        onClick={handleClose}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        aria-label="关闭"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div className="pr-5">{notification.message}</div>
    </div>
  );
} 