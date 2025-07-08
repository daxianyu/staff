import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface DropdownPortalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  triggerElement: HTMLElement | null;
  className?: string;
  offset?: { x: number; y: number };
}

export default function DropdownPortal({
  isOpen,
  onClose,
  children,
  triggerElement,
  className = '',
  offset = { x: 0, y: 4 }
}: DropdownPortalProps) {
  const [position, setPosition] = useState({ top: 0, left: 0, direction: 'down' as 'up' | 'down' });
  const menuRef = useRef<HTMLDivElement>(null);

  // 计算菜单位置
  const calculatePosition = useCallback(() => {
    if (!triggerElement || !menuRef.current) return;

    const triggerRect = triggerElement.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    // 计算基础位置
    let top = triggerRect.bottom + scrollY + offset.y;
    let left = triggerRect.left + scrollX + offset.x;
    let direction: 'up' | 'down' = 'down';

    // 检查是否超出底部，如果是则向上弹出
    if (triggerRect.bottom + menuRect.height + offset.y > viewportHeight) {
      if (triggerRect.top - menuRect.height - offset.y >= 0) {
        top = triggerRect.top + scrollY - menuRect.height - offset.y;
        direction = 'up';
      }
    }

    // 检查是否超出右边界
    if (left + menuRect.width > viewportWidth) {
      left = triggerRect.right + scrollX - menuRect.width - offset.x;
    }

    // 确保不超出左边界
    if (left < 0) {
      left = 8; // 8px 边距
    }

    setPosition({ top, left, direction });
  }, [triggerElement, offset]);

  // 监听点击外部关闭菜单
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        triggerElement &&
        !triggerElement.contains(target)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, triggerElement]);

  // 当菜单打开时计算位置
  useEffect(() => {
    if (isOpen) {
      // 使用 setTimeout 确保菜单已渲染
      const timer = setTimeout(calculatePosition, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, calculatePosition]);

  // 监听滚动和窗口大小变化
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => calculatePosition();
    const handleScroll = () => calculatePosition();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, calculatePosition]);

  if (!isOpen) return null;

  const menuElement = (
    <div
      ref={menuRef}
      className={`fixed bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[9999] max-h-80 overflow-y-auto transform-gpu will-change-transform backdrop-blur-sm transition-opacity duration-150 ${className}`}
      style={{
        top: position.top,
        left: position.left,
        opacity: position.top > 0 ? 1 : 0, // 避免位置计算前闪烁
      }}
    >
      {children}
    </div>
  );

  // 使用 Portal 渲染到 body
  return createPortal(menuElement, document.body);
} 