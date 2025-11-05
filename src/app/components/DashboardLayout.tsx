'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getFilteredMenuConfig } from '@/utils/menuFilter';
import { MenuItem } from '@/types/permission';
import {
  HomeIcon,
  UserIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  CalendarIcon,
  TableCellsIcon,
  UserGroupIcon,
  ChevronDownIcon,
  XMarkIcon,
  Bars3Icon,
  BookOpenIcon,
  BuildingOffice2Icon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  PlusCircleIcon,
  CalculatorIcon,
  MapPinIcon,
  HomeModernIcon,
} from '@heroicons/react/24/outline';

// 图标映射表
const iconMap: Record<string, React.ElementType> = {
  'dashboard': HomeIcon,
  'calendar': CalendarIcon,
  'users': UserGroupIcon,
  'user-group': UserGroupIcon,
  'graduation-cap': AcademicCapIcon,
  'book': BookOpenIcon,
  'building': BuildingOffice2Icon,
  'building-office': BuildingOffice2Icon,
  'home': HomeModernIcon,
  'dollar-sign': CurrencyDollarIcon,
  'settings': Cog6ToothIcon,
  'table': TableCellsIcon,
  'user': UserIcon,
  'chart': ChartBarIcon,
  'clipboard-document-list': ClipboardDocumentListIcon,
  'plus-circle': PlusCircleIcon,
  'calculator': CalculatorIcon,
  'map-pin': MapPinIcon,
};

// 获取图标组件
const getIcon = (iconName?: string): React.ElementType => {
  return iconName ? iconMap[iconName] || TableCellsIcon : TableCellsIcon;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const { logout, user } = useAuth();
  const initialRenderRef = useRef(true);

  // 获取过滤后的菜单配置
  const authorizedNavigation = useMemo(() => {
    return getFilteredMenuConfig(user);
  }, [user]);

  // 检查是否是移动设备
  useEffect(() => {
    // 默认在大屏设备上显示侧边栏
    const isMobile = window.innerWidth < 768;
    setSidebarOpen(!isMobile);

    // 监听屏幕大小变化
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('退出失败:', error);
    }
  };

  const isMenuActive = (item: MenuItem): boolean => {
    if (item.path) {
      return pathname === item.path;
    }
    return item.children?.some((child) => pathname === child.path) || false;
  };

  const isChildActive = (path: string): boolean => {
    return pathname === path;
  };

  const toggleSubmenu = (menuKey: string) => {
    setExpandedMenu(expandedMenu === menuKey ? null : menuKey);
  };

  // 仅在组件初始挂载时自动展开当前路径对应的菜单，不干扰用户后续手动操作
  useEffect(() => {
    if (initialRenderRef.current) {
      // 检查当前路径是否在某个有子菜单的菜单项内
      const menuWithActivePath = authorizedNavigation.find(item => 
        item.children?.some(child => pathname === child.path)
      );
      
      // 如果找到了匹配的菜单项，则自动展开它
      if (menuWithActivePath) {
        setExpandedMenu(menuWithActivePath.key);
      }
      initialRenderRef.current = false;
    }
  }, [pathname, authorizedNavigation]); // 添加正确的依赖项

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部状态栏 */}
      <div className="sticky top-0 z-30 shadow-sm" style={{ background: 'var(--header-bg)' }}>
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            {/* 移动端汉堡菜单按钮 */}
            <button 
              className="md:hidden mr-2 hover:opacity-80 transition-opacity duration-200"
              style={{ color: 'var(--header-text)' }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="菜单"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <div className="flex flex-shrink-0 items-center">
              <img 
                src="https://www.huayaopudong.com/static/logo.png" 
                alt="课程管理系统" 
                className="h-12"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center" style={{ color: 'var(--header-text)' }}>
                <UserIcon className="h-5 w-5 opacity-70 mr-2 hidden sm:inline" />
                <span className="font-medium truncate max-w-[100px] whitespace-nowrap">
                  {user.name || '用户'}
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center px-2 sm:px-4 py-2 rounded-lg transition-all duration-200 hover:bg-white/10 active:bg-white/20"
              style={{ color: 'var(--header-text)' }}
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5 sm:mr-2" />
              <span className="hidden sm:inline">退出</span>
            </button>
          </div>
        </div>
      </div>

      {/* 移动端菜单遮罩层 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <div className="flex h-[calc(100vh-4rem)]">
        {/* 左侧菜单栏 */}
        <div 
          className={`fixed md:static z-50 w-64 h-full transition-all duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
          style={{ background: 'var(--sidebar-bg)' }}
        >
          <nav className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30">
            {/* 移动端关闭按钮 */}
            <div className="flex justify-end px-4 pt-4 md:hidden">
              <button
                onClick={() => setSidebarOpen(false)}
                className="opacity-80 hover:opacity-100 transition-opacity duration-200"
                style={{ color: 'var(--sidebar-text)' }}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="py-2">
              <div className="space-y-1 pb-[200px]">
                {authorizedNavigation.map((item) => {
                  const isActive = isMenuActive(item);
                  const hasChildren = item.children && item.children.length > 0;
                  const isExpanded = expandedMenu === item.key;
                  const IconComponent = getIcon(item.icon);

                  return (
                    <div key={item.key} className="">
                      <button
                        onClick={() => hasChildren ? toggleSubmenu(item.key) : item.path && router.push(item.path)}
                        className={`
                          group flex w-full items-center justify-between px-2 py-2.5 text-md font-medium 
                          transition-all duration-200 ease-in-out
                          ${
                            isActive
                              ? 'bg-white/20'
                              : 'hover:bg-white/10'
                          }
                        `}
                        style={{ color: isActive ? 'var(--sidebar-text)' : 'rgba(255,255,255,0.9)' }}
                      >
                        <div className="flex items-center">
                          <IconComponent
                            className="mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200"
                            style={{ 
                              color: isActive ? 'var(--sidebar-text)' : 'rgba(255,255,255,0.7)'
                            }}
                            aria-hidden="true"
                          />
                          {item.label}
                        </div>
                        {hasChildren && (
                          <ChevronDownIcon
                            className={`h-4 w-4 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        )}
                      </button>
                      
                      {/* 二级菜单 */}
                      {hasChildren && isExpanded && item.children && (
                        <div className="ml-4 space-y-1 pt-1">
                          {item.children.map((child) => {
                            const ChildIconComponent = getIcon(child.icon);
                            return (
                              <button
                                key={child.key}
                                onClick={() => child.path && router.push(child.path)}
                                className={`
                                  group flex w-full items-center px-3 py-2 text-sm font-medium
                                  transition-all duration-200 ease-in-out
                                  ${
                                    child.path && isChildActive(child.path)
                                      ? 'bg-white/20'
                                      : 'hover:bg-white/10'
                                  }
                                `}
                                style={{ 
                                  color: child.path && isChildActive(child.path) 
                                    ? 'var(--sidebar-text)' 
                                    : 'rgba(255,255,255,0.8)' 
                                }}
                              >
                                <ChildIconComponent
                                  className="mr-3 h-4 w-4 flex-shrink-0 transition-colors duration-200"
                                  style={{ 
                                    color: child.path && isChildActive(child.path)
                                      ? 'var(--sidebar-text)'
                                      : 'rgba(255,255,255,0.7)'
                                  }}
                                  aria-hidden="true"
                                />
                                {child.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>

        {/* 主内容区域 */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto sm:p-4 lg:p-8">
            {children}
          </div>
        </div>
      </div>
      
      {/* 底部踢脚线 */}
      <div 
        className="fixed bottom-0 left-0 right-0 h-[2px] z-20 shadow-[0_-2px_8px_rgba(0,0,0,0.1)]" 
        style={{ background: 'var(--sidebar-bg)' }}
      ></div>
    </div>
  );
} 