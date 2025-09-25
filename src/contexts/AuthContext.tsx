import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UserInfo, AuthContextType } from '@/types/permission';
import { authService } from '@/services/authService';
import { handleUserRedirect } from '@/services/auth';
import { PERMISSIONS, OPERATION_RIGHTS } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionOverrides, setPermissionOverrides] = useState<{[key: string]: boolean}>({});
  const router = useRouter();

  // user.mentor_leader 学科组长
  // 合并用户的所有权限
  const baseRights = useMemo(() => {
    return user ? [
      ...(Array.isArray(user.rights) ? user.rights : []), 
      ...(Array.isArray(user.operation_right) ? user.operation_right.map(String) : []),
      ...(user.tool_user ? [PERMISSIONS.VIEW_COMMITMENT, PERMISSIONS.EDIT_COMMITMENT] : [])
    ] : [];
  }, [user]);
  
  // 应用权限覆盖（仅在开发/调试模式下）
  const rights = useMemo(() => {
    return baseRights.filter(right => {
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
  }, [baseRights, permissionOverrides]);

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

  const login = useCallback(async (username: string, password: string) => {
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
  }, [router]);

  const logout = useCallback(async () => {
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
  }, [router]);

  // 检查单个权限
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    
    // 根据权限文档检查特殊权限
    // 兼容后端返回 core_user 为字符串/数字/布尔
    const isCoreUser = Number((user as any).core_user) === 1 || (user as any).core_user === true;
    const operationRights = Array.isArray(user.operation_right) ? user.operation_right : [];
    
    // 核心用户拥有所有权限
    if (isCoreUser) return true;
    
    // 检查基础权限（字符串权限）
    if (rights.includes(permission)) return true;
    
    // 需要 operation_right为11 或 core_user=1 的权限
    const withdrawalPermissions = [
      PERMISSIONS.VIEW_WITHDRAWAL_OVERVIEW,
      PERMISSIONS.EDIT_WITHDRAWAL_OVERVIEW,
      PERMISSIONS.VIEW_LATE_CASHIN_OVERVIEW,
      PERMISSIONS.EDIT_LATE_CASHIN_OVERVIEW,
      PERMISSIONS.VIEW_REMARK_OVERVIEW,
      PERMISSIONS.EDIT_REMARK_OVERVIEW,
    ];
    if (withdrawalPermissions.includes(permission as any)) {
      return operationRights.includes(OPERATION_RIGHTS.WITHDRAWAL_MANAGEMENT);
    }
    
    // 需要 operation_right为13 或 core_user=1 的权限
    const polishPermissions = [
      PERMISSIONS.VIEW_PS_POLISH,
      PERMISSIONS.EDIT_PS_POLISH,
    ];
    if (polishPermissions.includes(permission as any)) {
      return operationRights.includes(OPERATION_RIGHTS.PS_POLISH);
    }
    
    // 需要 operation_right为16 或 core_user=1 的权限
    const cardPermissions = [
      PERMISSIONS.VIEW_CARD_BIND,
      PERMISSIONS.EDIT_CARD_BIND,
      PERMISSIONS.VIEW_CARD_CONSUME,
      PERMISSIONS.EDIT_CARD_CONSUME,
    ];
    if (cardPermissions.includes(permission as any)) {
      return operationRights.includes(OPERATION_RIGHTS.CARD_MANAGEMENT);
    }
    
    // 基础权限 - 所有staff用户都可以访问
    const basicPermissions = [
      PERMISSIONS.VIEW_SUBJECT_EVALUATE,
      PERMISSIONS.EDIT_SUBJECT_EVALUATE,
      PERMISSIONS.VIEW_EXIT_PERMIT,
      PERMISSIONS.EDIT_EXIT_PERMIT,
      PERMISSIONS.VIEW_GRADUATION_WISHES,
      PERMISSIONS.EDIT_GRADUATION_WISHES,
      PERMISSIONS.VIEW_TRANSCRIPT_APPLY,
      PERMISSIONS.EDIT_TRANSCRIPT_APPLY,
      PERMISSIONS.VIEW_MY_CARD,
      PERMISSIONS.EDIT_MY_CARD,
      PERMISSIONS.VIEW_MY_SUBJECTS,
      PERMISSIONS.EDIT_MY_SUBJECTS,
      PERMISSIONS.EDIT_PROFILE,
      // Mentee 相关权限 - 所有staff用户都可以访问
      PERMISSIONS.VIEW_MENTEE,
      PERMISSIONS.EDIT_MENTEE,
      PERMISSIONS.VIEW_MY_MENTORS,
      PERMISSIONS.MANAGE_STUDENT_STATUS,
      PERMISSIONS.VIEW_STUDENT_DETAILS,
      PERMISSIONS.ADD_STUDENT_COMPLAINT,
      PERMISSIONS.EDIT_ASSIGNMENT_REQUEST,
      PERMISSIONS.MANAGE_STUDENT_EXAMS,
    ];
    if (basicPermissions.includes(permission as any)) {
      return true; // 所有staff用户都可以访问
    }
    
    return false;
  }, [user, rights]);

  // 检查多个权限（任意一个满足）
  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    if (!user || !permissions.length) return false;
    return permissions.some(permission => rights.includes(permission));
  }, [user, rights]);

  // 检查多个权限（全部满足）
  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    if (!user || !permissions.length) return false;
    return permissions.every(permission => rights.includes(permission));
  }, [user, rights]);

  // 权限覆盖相关函数（仅用于调试）
  const setPermissionOverride = useCallback((permission: string, enabled: boolean) => {
    setPermissionOverrides(prev => ({
      ...prev,
      [permission]: enabled
    }));
  }, []);

  const clearPermissionOverrides = useCallback(() => {
    setPermissionOverrides({});
  }, []);

  const getPermissionOverrides = useCallback(() => permissionOverrides, [permissionOverrides]);
  const getBaseRights = useCallback(() => baseRights, [baseRights]);

  const contextValue: AuthContextType = useMemo(() => ({
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
  }), [
    user,
    rights,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    login,
    logout,
    setPermissionOverride,
    clearPermissionOverrides,
    getPermissionOverrides,
    getBaseRights,
  ]);

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
