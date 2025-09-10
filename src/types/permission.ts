/**
 * 权限系统相关类型定义
 */

// 用户信息类型（基于实际API返回结构）
export interface UserInfo {
  id: number;
  first_name: string;
  last_name: string;
  name: string;
  gender: number;
  mentor_leader_id: number;
  mentor_leader: number;
  campus_id: number;
  company_email: string;
  type: number;
  tool_user: boolean;
  core_user: number;          // 核心用户标识
  rights: string[];           // 核心权限数组
  operation_right: number[];  // 操作权限数组（数字类型）
  topics: Record<string, string>;
  exp: number;
}

// 权限检查模式
export type PermissionMode = 'any' | 'all';

// 菜单项配置
export interface MenuItem {
  key: string;
  label: string;
  path?: string;
  icon?: string;
  requiredPermissions?: string[];     // 任意一个满足即可
  requiredAllPermissions?: string[];  // 全部满足才显示
  children?: MenuItem[];
}

// 权限控制组件属性
export interface PermissionGateProps {
  permission?: string;                    // 单个权限
  permissions?: string[];                 // 多个权限
  mode?: PermissionMode;                  // 权限检查模式
  fallback?: React.ReactNode;            // 自定义无权限内容
  showNoPermission?: boolean;            // 显示默认无权限提示
  children: React.ReactNode;
}

// 权限上下文类型
export interface AuthContextType {
  user: UserInfo | null;
  rights: string[];                                    // 合并后的权限数组
  hasPermission: (permission: string) => boolean;     // 检查单个权限
  hasAnyPermission: (permissions: string[]) => boolean; // 任意一个权限
  hasAllPermissions: (permissions: string[]) => boolean; // 全部权限
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  
  // 调试相关功能（仅开发模式使用）
  setPermissionOverride?: (permission: string, enabled: boolean) => void;
  clearPermissionOverrides?: () => void;
  getPermissionOverrides?: () => {[key: string]: boolean};
  getBaseRights?: () => string[];
}

// 常用权限常量（可根据实际业务扩展）
export const COMMON_PERMISSIONS = {
  // 核心管理
  CORE_ADMIN: 'core_admin',
  
  // 员工管理
  VIEW_STAFF: 'view_staff',
  EDIT_STAFF: 'edit_staff',
  DELETE_STAFF: 'delete_staff',
  CREATE_STAFF: 'create_staff',
  VIEW_STAFF_CONTACT: 'view_staff_contact',
  
  // 学生管理
  VIEW_STUDENTS: 'view_students',
  EDIT_STUDENTS: 'edit_students',
  DELETE_STUDENTS: 'delete_students',
  ADD_STUDENTS: 'add_students',
  VIEW_STUDENTS_CONTACT: 'view_students_contact',
  
  // 课程管理
  VIEW_CLASSES: 'view_classes',
  EDIT_CLASSES: 'edit_classes',
  DELETE_CLASSES: 'delete_classes',
  
  // 教室管理
  VIEW_CLASSROOMS: 'view_classrooms',
  EDIT_CLASSROOMS: 'edit_classrooms',
  DELETE_CLASSROOMS: 'delete_classrooms',
  
  // 财务相关
  FINANCE: 'finance',
  VIEW_ACCOUNTING: 'view_accounting',
  SALES_PERSON: 'sales_person',
  SALES_ADMIN: 'sales_admin',
  
  // 日程管理
  EDIT_OWN_SCHEDULE: 'edit_own_schedule',
  EDIT_SCHEDULE_NO_TIME_LIMIT: 'edit_schedule_no_time_limit',
  VIEW_DAY_OVERVIEW: 'view_day_overview',
  VIEW_TEACHING_HOURS_OVERVIEW: 'view_teaching_hours_overview',
  VIEW_LESSON_OVERVIEW: 'view_lesson_overview',
  
  // 其他
  VIEW_LOG: 'view_log',
  CROSS_CAMPUS_RIGHTS: 'cross_campus_rights',
  CROSS_CAMPUS_VIEW: 'cross_campus_view',
} as const;

// 权限常量类型
export type PermissionKey = typeof COMMON_PERMISSIONS[keyof typeof COMMON_PERMISSIONS]; 