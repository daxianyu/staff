import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: Array<{
    label: string;
    value: string;
    onClick?: () => void;
    disabled?: boolean;
    danger?: boolean;
  }>;
  className?: string;
}

export default function CustomDropdownMenu({ trigger, items, className = '' }: DropdownMenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className={`inline-flex items-center justify-center gap-2 ${className}`}>
          {trigger}
          <ChevronDownIcon className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[200px] bg-white rounded-lg shadow-lg border border-gray-200 p-1"
          sideOffset={5}
          style={{ zIndex: 1100 }}
        >
          {items.map((item, index) => (
            <DropdownMenu.Item
              key={item.value}
              onClick={item.onClick}
              disabled={item.disabled}
              className={`flex items-center px-3 py-2 text-sm rounded-md cursor-pointer transition-colors outline-none ${
                item.disabled
                  ? 'text-gray-400 cursor-not-allowed'
                  : item.danger
                  ? 'text-red-600 hover:bg-red-50 focus:bg-red-50'
                  : 'text-gray-700 hover:bg-gray-50 focus:bg-gray-50'
              }`}
            >
              {item.label}
            </DropdownMenu.Item>
          ))}
          <DropdownMenu.Arrow className="fill-white" />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
} 