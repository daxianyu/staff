'use client';

import DashboardLayout from './DashboardLayout';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { setGlobalRouter } from '@/services/auth';
import { initTheme } from '@/utils/theme';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  
  // 设置全局router实例，供未认证处理使用
  useEffect(() => {
    setGlobalRouter(router);
  }, [router]);

  // 页面初始化时加载主题
  useEffect(() => {
    initTheme();
  }, []);
  
  // 不需要权限检查的路由
  const publicRoutes = ['/login', '/403'];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    if (!user) {
      if (!isPublicRoute) {
      router.push('/login');
    }
      return;
    }

  }, [user, isPublicRoute, router, pathname]);

  // 如果是公开路由，直接渲染
  if (isPublicRoute) {
    return children;
  }

  // 如果需要登录但未登录，返回null（等待重定向）
  if (!user) {
    return null;
  }

  // 用户已登录，使用DashboardLayout
  return <DashboardLayout>{children}</DashboardLayout>;
} 