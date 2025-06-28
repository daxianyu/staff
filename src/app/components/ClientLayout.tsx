'use client';

import DashboardLayout from './DashboardLayout';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useSalesInfo } from '@/contexts/SalesInfoContext';

// 定义SalesInfo接口已移动到SalesInfoContext中

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { salesInfo, isLoading } = useSalesInfo();
  
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

    // 处理pre_student用户限制：type为4且info_sign为0时只能访问my-profile页面
    if (user.data?.type === 4 && !isLoading) {
      // 使用Context中的salesInfo而不是直接调用API
      if (salesInfo?.info_sign === 0 && pathname !== '/my-profile') {
        router.push('/my-profile');
      }
    }
  }, [user, isPublicRoute, router, pathname, salesInfo, isLoading]);

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