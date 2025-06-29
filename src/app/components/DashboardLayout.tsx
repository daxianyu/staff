'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  HomeIcon,
  UserIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  CalendarIcon,
  TableCellsIcon,
  UserGroupIcon,
  AcademicCapIcon,
  UserPlusIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  CreditCardIcon,
  ChatBubbleLeftRightIcon,
  KeyIcon,
  BookOpenIcon,
  LockClosedIcon,
  DocumentCheckIcon,
  ArrowRightOnRectangleIcon,
  PencilSquareIcon,
  WrenchScrewdriverIcon,
  BanknotesIcon,
  PencilIcon,
  XMarkIcon,
  DocumentTextIcon,
  BellIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';

interface MenuItem {
  name: string;
  href?: string;
  icon: React.ElementType;
  permission?: string;
  children?: MenuItem[];
}

const navigation: MenuItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: UserGroupIcon, permission: PERMISSIONS.VIEW_DASHBOARD },
  {
    name: 'Schedule',
    icon: CalendarIcon,
    children: [
      { name: 'Schedule', href: '/schedule', icon: CalendarIcon, permission: PERMISSIONS.VIEW_SCHEDULE },
    ]
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const { logout, hasPermission, user } = useAuth();
  const initialRenderRef = useRef(true);

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
    if (item.href) {
      return pathname === item.href;
    }
    return item.children?.some((child) => pathname === child.href) || false;
  };

  const isChildActive = (href: string): boolean => {
    return pathname === href;
  };

  const toggleSubmenu = (menuName: string) => {
    setExpandedMenu(expandedMenu === menuName ? null : menuName);
  };

  // 过滤掉没有权限的菜单项
  const filterMenuByPermission = (items: MenuItem[]): MenuItem[] => {
    return items.filter(item => {
      // 如果是父菜单项且有子菜单
      if (item.children && item.children.length > 0) {
        // 过滤子菜单
        const filteredChildren = item.children.filter(child => 
          !child.permission || hasPermission(child.permission)
        );
        
        // 如果过滤后还有子菜单，则保留父菜单，并更新其子菜单
        if (filteredChildren.length > 0) {
          item.children = filteredChildren;
          return true;
        }
        return false;
      }
      
      // 如果是普通菜单项，检查权限
      return !item.permission || hasPermission(item.permission);
    });
  };

  const authorizedNavigation = filterMenuByPermission(navigation);

  // 仅在组件初始挂载时自动展开当前路径对应的菜单，不干扰用户后续手动操作
  useEffect(() => {
    if (initialRenderRef.current) {
      // 检查当前路径是否在某个有子菜单的菜单项内
      const menuWithActivePath = authorizedNavigation.find(item => 
        item.children?.some(child => pathname === child.href)
      );
      
      // 如果找到了匹配的菜单项，则自动展开它
      if (menuWithActivePath) {
        setExpandedMenu(menuWithActivePath.name);
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
                  {user.username || (user.data && user.data.name) || '用户'}
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
            <div className="py-2 px-1">
              <div className="space-y-1">
                {authorizedNavigation.map((item) => {
                  const isActive = isMenuActive(item);
                  const hasChildren = item.children && item.children.length > 0;
                  const isExpanded = expandedMenu === item.name;

                  return (
                    <div key={item.name} className="space-y-1">
                      <button
                        onClick={() => hasChildren ? toggleSubmenu(item.name) : item.href && router.push(item.href)}
                        className={`
                          group flex w-full items-center justify-between px-3 py-2.5 text-md font-medium rounded-lg
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
                          <item.icon
                            className="mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200"
                            style={{ 
                              color: isActive ? 'var(--sidebar-text)' : 'rgba(255,255,255,0.7)'
                            }}
                            aria-hidden="true"
                          />
                          {item.name}
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
                          {item.children.map((child) => (
                            <button
                              key={child.name}
                              onClick={() => child.href && router.push(child.href)}
                              className={`
                                group flex w-full items-center px-3 py-2 text-sm font-medium rounded-lg
                                transition-all duration-200 ease-in-out
                                ${
                                  child.href && isChildActive(child.href)
                                    ? 'bg-white/20'
                                    : 'hover:bg-white/10'
                                }
                              `}
                              style={{ 
                                color: child.href && isChildActive(child.href) 
                                  ? 'var(--sidebar-text)' 
                                  : 'rgba(255,255,255,0.8)' 
                              }}
                            >
                              <child.icon
                                className="mr-3 h-4 w-4 flex-shrink-0 transition-colors duration-200"
                                style={{ 
                                  color: child.href && isChildActive(child.href)
                                    ? 'var(--sidebar-text)'
                                    : 'rgba(255,255,255,0.7)'
                                }}
                                aria-hidden="true"
                              />
                              {child.name}
                            </button>
                          ))}
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
          <div className="max-w-7xl mx-auto p-2 sm:p-4 lg:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 