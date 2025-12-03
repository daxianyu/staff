'use client';

import { useEffect, useState, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface DropdownPortalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerElement: HTMLElement | null;
  children: ReactNode;
}

export default function DropdownPortal({
  isOpen,
  onClose,
  triggerElement,
  children,
}: DropdownPortalProps) {
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !triggerElement) return;

    const updatePosition = () => {
      const rect = triggerElement.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // 计算位置：按钮右下角对齐
      let right = viewportWidth - rect.right;
      let top = rect.bottom + 8; // 8px margin

      // 确保不超出右边界
      const dropdownWidth = 192; // w-48 = 12rem = 192px
      if (right + dropdownWidth > viewportWidth - 16) {
        right = viewportWidth - dropdownWidth - 16;
      }

      // 如果下方空间不足，向上显示
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 100; // 估算高度

      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        top = rect.top - dropdownHeight - 8;
      }

      setPosition({ top, right });
    };

    updatePosition();

    // 监听滚动和窗口大小变化
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, triggerElement]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        triggerElement &&
        !triggerElement.contains(target)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, triggerElement]);

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[100]" 
        onClick={onClose}
      />
      {/* Dropdown Menu */}
      <div
        ref={dropdownRef}
        className="fixed bg-white rounded-lg shadow-xl border border-gray-200 z-[101] w-48"
        style={{
          top: `${position.top}px`,
          right: `${position.right}px`,
        }}
      >
        {children}
      </div>
    </>,
    document.body
  );
}

