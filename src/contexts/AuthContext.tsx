import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User, PERMISSIONS } from '@/types/auth';
import { authService } from '@/services/authService';
import { handleUserRedirect } from '@/services/auth';

interface UserInfoResponse {
  id: number;
  name: string;
  type: number;
  campus_id: number;
  day_student: number;
  email: string;
  enrolment_date: number;
  exp: number;
  fill_in_details: number;
  first_name: string;
  gender: number;
  graduation_date: number;
  last_name: string;
  mentor_id: number;
  phone_number: string;
}

interface SalesInfoResponse {
  info_sign: number;
  // 其他可能的字段
}

// 扩展User类型以包含data属性
interface ExtendedUser extends User {
  data?: UserInfoResponse;
}

interface AuthContextType {
  user: ExtendedUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permissionCode: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 预定义角色
const ROLES = {
  ADMIN: {
    id: 'admin',
    name: '管理员',
    permissions: [
      PERMISSIONS.VIEW_WARNINGS,
      PERMISSIONS.VIEW_SCHEDULE,
      PERMISSIONS.VIEW_LESSON_TABLE,
      PERMISSIONS.VIEW_CARD,
      PERMISSIONS.FILE_COMPLAINT,
      PERMISSIONS.EDIT_PROFILE,
      PERMISSIONS.VIEW_BOOK_LOCKER,
      PERMISSIONS.VIEW_PASTPAPER_TEXTBOOKS,
      PERMISSIONS.VIEW_WEEKEND_PLAN,
      PERMISSIONS.VIEW_CERTIFICATE_APPLY,
      PERMISSIONS.VIEW_EXIT_PERMIT,
      PERMISSIONS.VIEW_CLASS_SIGNUP,
      PERMISSIONS.VIEW_SERVICE,
      PERMISSIONS.VIEW_LATE_CASHIN,
      PERMISSIONS.VIEW_REMARKING,
      PERMISSIONS.VIEW_EXAM_WITHDRAWAL,
      PERMISSIONS.VIEW_SCORE_REPORT,
      PERMISSIONS.VIEW_TEXTBOOK,
      PERMISSIONS.VIEW_NOTIFICATION,
      PERMISSIONS.VIEW_EXAM_SIGNUP
    ]
  },
  TEACHER: {
    id: 'teacher',
    name: '教师',
    permissions: [
      PERMISSIONS.VIEW_WARNINGS,
      PERMISSIONS.VIEW_SCHEDULE,
      PERMISSIONS.VIEW_LESSON_TABLE,
      PERMISSIONS.VIEW_CARD,
      PERMISSIONS.FILE_COMPLAINT,
      PERMISSIONS.EDIT_PROFILE,
      PERMISSIONS.VIEW_BOOK_LOCKER,
      PERMISSIONS.VIEW_PASTPAPER_TEXTBOOKS,
      PERMISSIONS.VIEW_WEEKEND_PLAN,
      PERMISSIONS.VIEW_CERTIFICATE_APPLY,
      PERMISSIONS.VIEW_EXIT_PERMIT,
      PERMISSIONS.VIEW_CLASS_SIGNUP,
      PERMISSIONS.VIEW_SERVICE,
      PERMISSIONS.VIEW_LATE_CASHIN,
      PERMISSIONS.VIEW_REMARKING,
      PERMISSIONS.VIEW_EXAM_WITHDRAWAL,
      PERMISSIONS.VIEW_SCORE_REPORT,
      PERMISSIONS.VIEW_TEXTBOOK,
      PERMISSIONS.VIEW_NOTIFICATION,
      PERMISSIONS.VIEW_EXAM_SIGNUP
    ]
  },
  STUDENT: {
    id: 'student',
    name: '学生',
    permissions: [
      PERMISSIONS.VIEW_SCHEDULE,
      PERMISSIONS.VIEW_LESSON_TABLE,
      PERMISSIONS.VIEW_WARNINGS,
      PERMISSIONS.VIEW_CARD,
      PERMISSIONS.FILE_COMPLAINT,
      PERMISSIONS.EDIT_PROFILE,
      PERMISSIONS.VIEW_BOOK_LOCKER,
      PERMISSIONS.VIEW_PASTPAPER_TEXTBOOKS,
      PERMISSIONS.VIEW_WEEKEND_PLAN,
      PERMISSIONS.VIEW_CERTIFICATE_APPLY,
      PERMISSIONS.VIEW_EXIT_PERMIT,
      PERMISSIONS.VIEW_CLASS_SIGNUP,
      PERMISSIONS.VIEW_SERVICE,
      PERMISSIONS.VIEW_LATE_CASHIN,
      PERMISSIONS.VIEW_REMARKING,
      PERMISSIONS.VIEW_EXAM_WITHDRAWAL,
      PERMISSIONS.VIEW_SCORE_REPORT,
      PERMISSIONS.VIEW_TEXTBOOK,
      PERMISSIONS.VIEW_NOTIFICATION,
      PERMISSIONS.VIEW_EXAM_SIGNUP
    ]
  },
  PRE_STUDENT: { // 报名学生，不是正式学生
    id: 'pre_student',
    name: '报名学生',
    permissions: [
      PERMISSIONS.INTERVIEW,
      PERMISSIONS.MY_PROFILE,
      PERMISSIONS.TEST_SCORE,
      PERMISSIONS.MY_TEST,
      PERMISSIONS.INTERVIEW
    ]
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 检查用户登录状态
    async function checkUserAuth() {
      try {
        setLoading(true);
        
        // 尝试从API获取用户信息
        const response = await authService.getUserInfo();
        
        if (response.code === 200 && response.data) {
          // API返回了用户信息，用户已登录
          const userData = response.data as UserInfoResponse;
          
          // 根据用户类型设置角色
          let role = {
            id: 'unknown',
            name: '未知',
            permissions: [] as string[]
          };
          if (userData.type === 1) {
            role = ROLES.STUDENT;
          } else if (userData.type === 4) {
            role = ROLES.PRE_STUDENT;
          }
          
          const user: ExtendedUser = {
            id: String(userData.id),
            username: String(userData.name),
            role,
            data: userData as any
          };
          setUser(user);
          localStorage.setItem('user', JSON.stringify(user));
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
      const userData = userReq.data as UserInfoResponse;
      
      // 根据用户类型设置角色
      let role = {
        id: 'unknown',
        name: '未知',
        permissions: [] as string[]
      };
      
      if (userData.type === 1) {
        role = ROLES.STUDENT;
      } else if (userData.type === 4) {
        role = ROLES.PRE_STUDENT;
      }
      
      const user: ExtendedUser = {
        id: String(userData.id),
        username: userData.name,
        role,
        data: userData
      };

      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));

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

  const hasPermission = (permissionCode: string): boolean => {
    if (!user) return false;
    return user.role.permissions.includes(permissionCode);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission }}>
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