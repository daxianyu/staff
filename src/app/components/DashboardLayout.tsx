'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getFilteredMenuConfig } from '@/utils/menuFilter';
import { MenuItem } from '@/types/permission';
import { buildFileUrl } from '@/config/env';
import { isInMiniProgram } from '@/utils/miniprogram';
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
  const [isMP, setIsMP] = useState(false);
  const { logout, user } = useAuth();
  const initialRenderRef = useRef(true);

  // 获取过滤后的菜单配置
  const authorizedNavigation = useMemo(() => {
    return getFilteredMenuConfig(user);
  }, [user]);

  // 检查是否是移动设备和是否在小程序环境
  useEffect(() => {
    const inMP = isInMiniProgram();
    setIsMP(inMP);
    
    // 默认在大屏设备上显示侧边栏
    const isMobile = window.innerWidth < 768;
    // 如果在小程序内，默认关闭侧边栏
    setSidebarOpen(inMP ? false : !isMobile);

    // 监听屏幕大小变化
    const handleResize = () => {
      if (isInMiniProgram()) {
        setSidebarOpen(false);
        return;
      }
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

  // 同步标题到微信小程序原生导航栏
  useEffect(() => {
    if (isMP && typeof window !== 'undefined' && (window as any).wx?.setNavigationBarTitle) {
      // 延迟一下确保页面标题已经更新
      setTimeout(() => {
        (window as any).wx.setNavigationBarTitle({
          title: document.title || '个人学校系统'
        });
      }, 100);
    }
  }, [pathname, isMP]);

  return (
    <div className={`min-h-screen bg-gray-50 ${isMP ? 'is-miniprogram flex flex-col' : ''}`}>
      {/* 顶部状态栏 */}
      <div 
        className={`sticky top-0 z-30 shadow-sm transition-all duration-200 ${isMP ? 'h-[calc(44px+var(--safe-area-top))] pt-safe flex-shrink-0' : 'h-16'}`} 
        style={{ background: 'var(--header-bg)' }}
      >
        <div className="flex h-full items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            {/* 汉堡菜单按钮 - 小程序始终显示，普通环境下仅移动端显示 */}
            <button 
              className={`${isMP ? 'block' : 'md:hidden'} mr-2 hover:opacity-80 transition-opacity duration-200 p-1`}
              style={{ color: 'var(--header-text)' }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="菜单"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            
            {/* Logo - 小程序下隐藏，PC下始终显示 */}
            <div className={`flex-shrink-0 items-center ${isMP ? 'hidden' : 'flex'}`}>
              <img 
                src={buildFileUrl('/static/logo.png')}
                alt="个人学校系统" 
                className="h-10 sm:h-12"
              />
            </div>
            
            {/* 小程序下的简易标题 */}
            {isMP && (
              <span className="text-white font-medium text-sm truncate max-w-[150px]">
                个人学校系统
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {user && (
              <div className="flex items-center" style={{ color: 'var(--header-text)' }}>
                <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 opacity-70 mr-1.5" />
                <span className="text-sm sm:text-base font-medium truncate max-w-[80px] sm:max-w-[120px] whitespace-nowrap">
                  {user.name || '用户'}
                </span>
              </div>
            )}
            
            {/* 退出按钮 - PC下直接显示，小程序下已移至侧边栏底部 */}
            <button
              onClick={handleLogout}
              className={`items-center px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all duration-200 hover:bg-white/10 active:bg-white/20 ${isMP ? 'hidden' : 'flex'}`}
              style={{ color: 'var(--header-text)' }}
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5 sm:mr-2" />
              <span className="hidden sm:inline">退出</span>
            </button>
          </div>
        </div>
      </div>

      {/* 菜单遮罩层 - 仅在移动端或小程序开启菜单时显示 */}
      {sidebarOpen && (
        <div 
          className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${isMP ? 'block' : 'md:hidden'}`}
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <div className={`flex ${isMP ? 'flex-1 overflow-hidden' : 'h-[calc(100vh-4rem)]'}`}>
        {/* 左侧菜单栏 */}
        <div 
          className={`
            fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out transform flex flex-col min-h-0 overflow-y-auto overflow-x-hidden
            ${isMP 
              ? (sidebarOpen ? 'translate-x-0 w-full' : '-translate-x-full w-full') 
              : (sidebarOpen ? 'translate-x-0 w-72 shadow-xl md:static md:w-64 md:translate-x-0 md:h-full md:shadow-none' : '-translate-x-full w-72 md:translate-x-0 md:static md:w-64 md:h-full')
            }
          `}
          style={{ background: 'var(--sidebar-bg)' }}
        >
          {/* 侧边栏头部 - 仅小程序或移动端显示 */}
          {(isMP || (typeof window !== 'undefined' && window.innerWidth < 768)) && (
            <div className="flex items-center justify-between px-6 py-5 pt-safe bg-black/10">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-white/30 rounded-full"></div>
                <span className="text-white text-lg font-bold tracking-wide">功能导航</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-all duration-200 active:scale-95 shadow-inner"
                aria-label="关闭菜单"
              >
                <XMarkIcon className="h-7 w-7" />
              </button>
            </div>
          )}

          <nav className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30">
            <div className="py-2 px-2">
              <div className="space-y-1">
                {authorizedNavigation.map((item) => {
                  const isActive = isMenuActive(item);
                  const hasChildren = item.children && item.children.length > 0;
                  const isExpanded = expandedMenu === item.key;
                  const IconComponent = getIcon(item.icon);

                  return (
                    <div key={item.key} className="mb-1">
                      <button
                        onClick={() => hasChildren ? toggleSubmenu(item.key) : item.path && (router.push(item.path), isMP && setSidebarOpen(false))}
                        className={`
                          group flex w-full items-center justify-between px-3 py-2.5 rounded-lg md:text-base text-sm font-medium 
                          transition-all duration-200 ease-in-out
                          ${
                            isActive
                              ? 'bg-white/20'
                              : 'hover:bg-white/10'
                          }
                        `}
                        style={{ color: isActive ? 'var(--sidebar-text)' : 'rgba(255,255,255,0.9)' }}
                      >
                        <div className="flex items-center min-w-0 flex-1">
                          <IconComponent
                            className="mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200"
                            style={{ 
                              color: isActive ? 'var(--sidebar-text)' : 'rgba(255,255,255,0.7)'
                            }}
                            aria-hidden="true"
                          />
                          <span className="truncate text-left">{item.label}</span>
                        </div>
                        {hasChildren && (
                          <ChevronDownIcon
                            className={`h-4 w-4 flex-shrink-0 ml-2 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        )}
                      </button>
                      
                      {/* 二级菜单 */}
                      {hasChildren && isExpanded && item.children && (
                        <div className="ml-4 mt-1 space-y-1 border-l border-white/10">
                          {item.children.map((child) => {
                            const ChildIconComponent = getIcon(child.icon);
                            return (
                              <button
                                key={child.key}
                                onClick={() => child.path && (router.push(child.path), isMP && setSidebarOpen(false))}
                                className={`group flex w-full items-center px-3 py-2 rounded-md md:text-sm text-xs font-medium transition-all duration-200 ease-in-out
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
                                <span className="text-left truncate min-w-0 flex-1">
                                  {child.label}
                                </span>
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

          {/* 侧边栏底部 - 仅小程序显示退出按钮 */}
          {isMP && (
            <div className="p-4 bg-white/5 pb-safe">
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center px-4 py-2.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all duration-200"
              >
                <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2" />
                <span className="text-sm">退出当前账号</span>
              </button>
            </div>
          )}
        </div>

        {/* 主内容区域 */}
        <div className="flex-1 overflow-auto overflow-touch">
          <div className={`max-w-7xl mx-auto ${isMP ? 'p-3 px-4' : 'sm:p-4 lg:p-8'}`}>
            {children}
          </div>
        </div>
      </div>
      
      {/* 底部装饰线 - 小程序隐藏 */}
      {!isMP && (
        <div 
          className="fixed bottom-0 left-0 right-0 h-[1px] z-20 shadow-[0_-1px_4px_rgba(0,0,0,0.05)]" 
          style={{ background: 'var(--sidebar-bg)' }}
        ></div>
      )}
    </div>
  );
} 