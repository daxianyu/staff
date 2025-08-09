// 导入新的权限类型
export * from './permission';
export type { UserInfo, AuthContextType, MenuItem, PermissionMode } from './permission';

// 原有的权限接口，保留向后兼容
export interface Permission {
  id: string;
  name: string;
  code: string;
}

// 预定义权限码（扩展版本，兼容新旧系统）
export const PERMISSIONS = {
  // 仪表盘
  VIEW_DASHBOARD: 'view_dashboard',
  
  // 课程相关
  VIEW_SCHEDULE: 'view_schedule',
  VIEW_LESSON_OVERVIEW: 'view_lesson_overview',
  VIEW_LESSON_TABLE: 'view_lesson_table',
  VIEW_DAY_OVERVIEW: 'view_day_overview',
  VIEW_TEACHING_HOURS_OVERVIEW: 'view_teaching_hours_overview',
  
  // Demo页面（保留兼容）
  VIEW_DEMO: 'view_demo',
  CREATE_DEMO: 'create_demo',
  EDIT_DEMO: 'edit_demo',
  DELETE_DEMO: 'delete_demo',
  
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
  EDIT_STUDENT_INFO: 'edit_student_info',
  VIEW_ALL_STUDENT_PROGRESS: 'view_all_student_progress',
  
  // 课程管理
  VIEW_CLASSES: 'view_classes',
  EDIT_CLASSES: 'edit_classes',
  DELETE_CLASSES: 'delete_classes',
  CAN_JOIN_ALL_CLASSES: 'can_join_all_classes',
  
  // 教室管理
  VIEW_CLASSROOMS: 'view_classrooms',
  EDIT_CLASSROOMS: 'edit_classrooms',
  DELETE_CLASSROOMS: 'delete_classrooms',
  CHANGE_CLASSROOM: 'change_classroom',
  
  // 财务相关
  FINANCE: 'finance',
  VIEW_ACCOUNTING: 'view_accounting',
  VIEW_NON_CREDIT_BASED_ACCOUNTING: 'view_non_credit_based_accounting',
  SALES_PERSON: 'sales_person',
  SALES_ADMIN: 'sales_admin',
  
  // 日程管理
  EDIT_OWN_SCHEDULE: 'edit_own_schedule',
  EDIT_SCHEDULE_NO_TIME_LIMIT: 'edit_schedule_no_time_limit',
  EDIT_LESSONS_ALL: 'edit_lessons_all',
  EDIT_LESSONS_WITH_AVAILABILITY: 'edit_lessons_with_availability',
  BOOK_LESSON_WITHOUT_CREDIT: 'book_lesson_without_credit',
  
  // 系统管理
  CORE_ADMIN: 'core_admin',
  VIEW_LOG: 'view_log',
  CROSS_CAMPUS_RIGHTS: 'cross_campus_rights',
  CROSS_CAMPUS_VIEW: 'cross_campus_view',
  EDIT_CAMPUSES: 'edit_campuses',
  
  // 其他权限
  MODULE_EDIT: 'module_edit',
  EDIT_PAY_MODELS: 'edit_pay_models',
  SELECT_STAFF_PAY_MODELS: 'select_staff_pay_models',
  STUDENT_ENROLLMENT_RIGHTS: 'student_enrollment_rights',
  VIEW_STAFF_FEEDBACK: 'view_staff_feedback',
  EDIT_EXAMS: 'edit_exams',
  EDIT_TESTS: 'edit_tests',
  EDIT_LIBRARY: 'edit_library',
  VIEW_DORMITORY: 'view_dormitory',
  EDIT_DORMITORY: 'edit_dormitory',
  EDIT_FRONT_PAGE: 'edit_front_page',
  VIEW_CONTRACTS: 'view_contracts',
  EDIT_STUDENT_FORM_SIGNUPS: 'edit_student_form_signups',
  EDIT_BOOKS: 'edit_books',
  EDIT_SURVEYS: 'edit_surveys',
  VIEW_COMPLAINTS: 'view_complaints',
  STUDENT_PDFS: 'student_pdfs',
  ENTER_GRADES: 'enter_grades',
  SUBJECT_RELATIVE: 'subject_relative',
  STUDENT_FULLNESS: 'student_fullness',
  STAS: 'stas',
  SMS: 'sms',
  VIEW_LOCKER: 'view_locker',
  EDIT_LOCKER: 'edit_locker',
} as const;

// 预定义角色常量（向后兼容）
export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher', 
  OTHER: 'other',
} as const;

// 预定义用户类型常量
export const USER_TYPES = {
  ADMIN: 0,
  TEACHER: 2,
  OTHER: 1,
} as const;

// 菜单项接口（向后兼容）
export interface Menu {
  name: string;
  path: string;
  icon?: React.ElementType;
  permission?: string;
  children?: Menu[];
}

// 用户角色接口（向后兼容）
export interface UserRole {
  id: string;
  name: string;
  permissions: string[];
}

// 用户接口（向后兼容）
export interface User {
  id: string;
  username: string;
  role: UserRole;
}

// 权限映射函数 - 用于新旧系统的兼容
export function mapUserTypeToRole(userType: number): UserRole {
  switch (userType) {
    case 0: // 管理员
      return {
        id: 'admin',
        name: '管理员',
        permissions: [], // 新系统中直接使用 rights 数组
      };
    case 2: // 教师
      return {
        id: 'teacher',
        name: '教师',
        permissions: [],
      };
    default:
      return {
        id: 'other',
        name: '其他',
        permissions: [],
      };
  }
}

// 权限检查辅助函数
export function checkPermission(userRights: string[], permission: string): boolean {
  return userRights.includes(permission);
}

export function checkAnyPermission(userRights: string[], permissions: string[]): boolean {
  return permissions.some(permission => userRights.includes(permission));
}

export function checkAllPermissions(userRights: string[], permissions: string[]): boolean {
  return permissions.every(permission => userRights.includes(permission));
} 