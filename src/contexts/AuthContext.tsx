import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { UserInfo, AuthContextType } from '@/types/permission';
import { authService } from '@/services/authService';
import { handleUserRedirect } from '@/services/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionOverrides, setPermissionOverrides] = useState<{[key: string]: boolean}>({});
  const router = useRouter();

  // user.mentor_leader 学科组长
  // 合并用户的所有权限
  const baseRights = user ? [...user.rights, ...user.operation_right] : [];
  
  // 应用权限覆盖（仅在开发/调试模式下）
  const rights = baseRights.filter(right => {
    // 如果有覆盖设置，使用覆盖设置
    if (permissionOverrides.hasOwnProperty(right)) {
      return permissionOverrides[right];
    }
    // 否则使用原始权限
    return true;
  }).concat(
    // 添加通过覆盖启用的新权限
    Object.keys(permissionOverrides).filter(right => 
      permissionOverrides[right] && !baseRights.includes(right)
    )
  );

  useEffect(() => {
    // 检查用户登录状态
    async function checkUserAuth() {
      try {
        setLoading(true);
        
        // 尝试从API获取用户信息
        const response = await authService.getUserInfo();
        
        if (response.code === 200 && response.data) {
          // API返回了用户信息，用户已登录
          const userData = response.data as UserInfo;
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          // API返回失败，用户未登录，清除本地信息并跳转到登录页
          setUser(null);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          router.push('/login');
        }
      } catch (error) {
        console.error('检查登录状态失败:', error);
        // 出错时也认为用户未登录
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    
    checkUserAuth();
  }, [router]);

  const login = async (username: string, password: string) => {
    try {
      const response = await authService.login({ username, password });
      
      if (response.code !== 200 || !response.token) {
        throw new Error(response.message || '登录失败');
      }

      // 保存token
      if (response.token) {
        localStorage.setItem('token', response.token);
      }
      
      // 获取用户信息
      const userReq = await authService.getUserInfo();
      const userData = userReq.data as UserInfo;
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));

      // 使用统一的重定向函数
      await handleUserRedirect(userData, router);
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const response = await authService.logout();
      if (response.code !== 200) {
        throw new Error(response.message || '退出失败');
      }
    } catch (error) {
      console.error('退出异常:', error);
    } finally {
      // 无论API是否成功，都清除本地状态
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      // 确保状态更新后再跳转
      setTimeout(() => {
        router.push('/login');
      }, 0);
    }
  };

  // 检查单个权限
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return rights.includes(permission);
  };

  // 检查多个权限（任意一个满足）
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user || !permissions.length) return false;
    return permissions.some(permission => rights.includes(permission));
  };

  // 检查多个权限（全部满足）
  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user || !permissions.length) return false;
    return permissions.every(permission => rights.includes(permission));
  };

  // 权限覆盖相关函数（仅用于调试）
  const setPermissionOverride = (permission: string, enabled: boolean) => {
    setPermissionOverrides(prev => ({
      ...prev,
      [permission]: enabled
    }));
  };

  const clearPermissionOverrides = () => {
    setPermissionOverrides({});
  };

  const getPermissionOverrides = () => permissionOverrides;
  const getBaseRights = () => baseRights;

  const contextValue: AuthContextType = {
    user,
    rights,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    login,
    logout,
    // 调试相关功能
    setPermissionOverride,
    clearPermissionOverrides,
    getPermissionOverrides,
    getBaseRights,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {loading ? <div>加载中...</div> : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 