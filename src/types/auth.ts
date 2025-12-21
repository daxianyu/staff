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
  VIEW_RETURN_LOCKER: 'view_locker',
  APPROVE_RETURN_LOCKER: 'edit_locker',

  // 承诺书管理
  VIEW_COMMITMENT: 'view_commitment',
  EDIT_COMMITMENT: 'edit_commitment',

  // Users 相关权限 - 基于 operation_right 数字权限
  // 基础权限 - 所有staff用户都可以访问（不需要特定数字权限）
  VIEW_SUBJECT_EVALUATE: 'view_subject_evaluate',
  EDIT_SUBJECT_EVALUATE: 'edit_subject_evaluate',
  VIEW_EXIT_PERMIT: 'view_exit_permit',
  EDIT_EXIT_PERMIT: 'edit_exit_permit',
  VIEW_GRADUATION_WISHES: 'view_graduation_wishes',
  EDIT_GRADUATION_WISHES: 'edit_graduation_wishes',
  VIEW_TRANSCRIPT_APPLY: 'view_transcript_apply',
  EDIT_TRANSCRIPT_APPLY: 'edit_transcript_apply',
  VIEW_MY_CARD: 'view_my_card',
  EDIT_MY_CARD: 'edit_my_card',
  VIEW_MY_SUBJECTS: 'view_my_subjects',
  EDIT_MY_SUBJECTS: 'edit_my_subjects',
  EDIT_PROFILE: 'edit_profile',

  // 需要 operation_right为11 或 core_user=1 的权限
  VIEW_WITHDRAWAL_OVERVIEW: 'view_withdrawal_overview',
  EDIT_WITHDRAWAL_OVERVIEW: 'edit_withdrawal_overview',
  VIEW_LATE_CASHIN_OVERVIEW: 'view_late_cashin_overview',
  EDIT_LATE_CASHIN_OVERVIEW: 'edit_late_cashin_overview',
  VIEW_REMARK_OVERVIEW: 'view_remark_overview',
  EDIT_REMARK_OVERVIEW: 'edit_remark_overview',

  // 需要 operation_right为13 或 core_user=1 的权限
  VIEW_PS_POLISH: 'view_ps_polish',
  EDIT_PS_POLISH: 'edit_ps_polish',

  // 其他权限
  VIEW_PROMOTE_COMMENT: 'view_promote_comment',
  EDIT_PROMOTE_COMMENT: 'edit_promote_comment',

  // Knowledge - Pastpaper Edit（subject_leader 或 core_user）
  VIEW_PASTPAPER_EDIT: 'view_pastpaper_edit',
  EDIT_PASTPAPER_EDIT: 'edit_pastpaper_edit',

  // Knowledge - Workspace（operation_right=25 或 core_user）
  VIEW_WORKSPACE: 'view_workspace',
  EDIT_WORKSPACE: 'edit_workspace',

  // 卡片管理权限
  VIEW_CARD_BIND: 'view_card_bind',
  EDIT_CARD_BIND: 'edit_card_bind',
  VIEW_CARD_CONSUME: 'view_card_consume',
  EDIT_CARD_CONSUME: 'edit_card_consume',
  VIEW_CARD_INFO: 'view_card_info',
  EDIT_CARD_INFO: 'edit_card_info',

  // Mentee 相关权限
  VIEW_MENTEE: 'view_mentee',
  EDIT_MENTEE: 'edit_mentee',
  VIEW_MY_MENTORS: 'view_my_mentors',
  MANAGE_STUDENT_STATUS: 'manage_student_status',
  VIEW_STUDENT_DETAILS: 'view_student_details',
  ADD_STUDENT_COMPLAINT: 'add_student_complaint',
  EDIT_ASSIGNMENT_REQUEST: 'edit_assignment_request',
  MANAGE_STUDENT_EXAMS: 'manage_student_exams',

  // STAS统计相关权限
  VIEW_STAS: 'stas',
  VIEW_CENTER_LIST: 'core_admin',
  VIEW_MENTEE_DASHBOARD: 'stas',
  VIEW_MENTOR_DASHBOARD: 'stas',
  VIEW_TEACHER_HOURS: 'view_teaching_hours_overview',
  VIEW_SUBJECT_RELATIVE: 'view_students',
  VIEW_SUBJECT_RELATIVE_MONTHLY: 'view_students',
  VIEW_STUDENT_FULLNESS: 'view_students',
  VIEW_CLASSROOM_USAGE: 'sales_person',
  VIEW_TEACHER_MONTHLY_HOURS: 'view_teaching_hours_overview',
  VIEW_STUDENT_MONTHLY_HOURS: 'view_teaching_hours_overview',
  VIEW_STUDENT_ATTENDANCE: 'stas',

  // Master Admin 相关权限
  REPLY_COMPLAINTS: 'core_user',
  VIEW_SET_SIGNUP_TIME: 'tool_user',
  EDIT_SET_SIGNUP_TIME: 'tool_user',
  VIEW_TOPICS: 'core_admin',
  EDIT_TOPICS: 'core_admin',

  // School Admin 相关权限
  // 警告管理权限 (operation_right=21)
  VIEW_WARNING_OVERVIEW: 'view_warning_overview',
  EDIT_WARNING_OVERVIEW: 'edit_warning_overview',

  // 周末计划权限 (operation_right=17)
  VIEW_WEEKEND_PLAN: 'view_weekend_plan',
  EDIT_WEEKEND_PLAN: 'edit_weekend_plan',

  // 节假日配置权限 (operation_right=22)
  VIEW_WEEKEND_SPECIAL_DATE: 'view_weekend_special_date',
  EDIT_WEEKEND_SPECIAL_DATE: 'edit_weekend_special_date',

  // 空闲搜索权限 (tool_user)
  VIEW_FREE_SEARCH: 'view_free_search',

  // 工具概览权限 (tool_user)
  VIEW_TOOLS_OVERVIEW: 'view_tools_overview',

  // 自助报名班级权限 (edit_classes or sales_admin)
  VIEW_SELF_SIGNUP_CLASSES: 'view_self_signup_classes',
  EDIT_SELF_SIGNUP_CLASSES: 'edit_self_signup_classes',

  // 证书管理权限 (operation_right=14)
  VIEW_CERTIFICATE_OVERVIEW: 'view_certificate_overview',

  // Core 相关权限 (需要 core_user=1)
  VIEW_CORE_RECORD: 'view_core_record',
  VIEW_CLASS_CHANGE_OVERVIEW: 'view_class_change_overview',
  VIEW_STAFF_RIGHTS: 'view_staff_rights',
  EDIT_STAFF_RIGHTS: 'edit_staff_rights',
  VIEW_OPERATION_CONFIG: 'view_operation_config',
  EDIT_OPERATION_CONFIG: 'edit_operation_config',
  VIEW_TIME_OPERATION_CONFIG: 'view_time_operation_config',
  EDIT_TIME_OPERATION_CONFIG: 'edit_time_operation_config',
  VIEW_ARCHIVES: 'view_archives',
  EDIT_ARCHIVES: 'edit_archives',
  VIEW_TOOLS: 'view_tools',
  EDIT_TOOLS: 'edit_tools',
  VIEW_PROMOTION: 'view_promotion',
  EDIT_PROMOTION: 'edit_promotion',
  VIEW_FEE_PROMOTION: 'view_fee_promotion',
  EDIT_FEE_PROMOTION: 'edit_fee_promotion',
  VIEW_PAY_CONFIG: 'view_pay_config',
  EDIT_PAY_CONFIG: 'edit_pay_config',
  VIEW_CORE_EXIT_PERMIT: 'view_core_exit_permit',
  EDIT_CORE_EXIT_PERMIT: 'edit_core_exit_permit',

  // Admission Admin 相关权限
  VIEW_ADMISSION_MANAGE: 'core_admin', // 查看所有sales记录
  EDIT_ADMISSION_MANAGE: 'sales_admin', // 创建/删除sales记录
  VIEW_SALES_INFO: 'sales_person', // 查看sales基本信息
  VIEW_CONTRACTS_INFO: 'view_contracts', // 查看合同信息（与sales_person等效）
  MANAGE_INTERVIEW_CONFIG: 'sales_core', // 管理面试配置（需要sales_core=1或core_user=1）
  MANAGE_EXAM_CONFIG: 'sales_core', // 管理考试配置（需要sales_core=1或core_user=1）
  VIEW_PAYMENT_INFO: 'sales_person', // 查看支付信息
} as const;

// 数字权限常量 - 基于 operation_right 数组
export const OPERATION_RIGHTS = {
  // 基础权限 - 所有staff用户都可以访问
  BASIC_STAFF: 0,

  // 退考管理、成绩补合并、备注管理权限
  WITHDRAWAL_MANAGEMENT: 11,

  // PS润色权限
  PS_POLISH: 13,

  // 卡片管理权限
  CARD_MANAGEMENT: 16,

  // 周末计划统计权限
  WEEKEND_PLAN: 17,

  // 警告管理权限
  WARNING_MANAGEMENT: 21,

  // 节假日配置权限
  WEEKEND_SPECIAL_DATE: 22,

  // 课程主题管理权限
  TOPICS_MANAGEMENT: 23,

  // 课时费晋升权限
  FEE_PROMOTION: 7,

  // 导师晋升权限
  MENTOR_PROMOTION: 10,

  // 档案管理权限
  ARCHIVES_MANAGEMENT_VIEW: 5,  // 查看权限
  ARCHIVES_MANAGEMENT_EDIT: 6,  // 编辑权限

  // 证书管理权限
  CERTIFICATE_MANAGEMENT: 14,

  // Knowledge - Workspace 管理权限
  WORKSPACE_MANAGEMENT: 25,
} as const;

// 预定义角色常量（向后兼容）
export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  OTHER: 'other',
} as const;

// 预定义用户类型常量
export const USER_TYPES = {
  STAFF: 0,           // 员工（原ADMIN）
  STUDENT: 1,         // 学生
  PARENT: 2,          // 家长
  STUDENT_CANDIDATE: 4, // 预备学生
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