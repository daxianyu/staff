export interface Permission {
  id: string;
  name: string;
  code: string;
}

// 预定义权限码
export const PERMISSIONS = {
  // 仪表盘
  VIEW_DASHBOARD: 'view_dashboard',
  
  // 课程相关
  VIEW_SCHEDULE: 'view_schedule',
  VIEW_LESSON_TABLE: 'view_lesson_table',
  
  // 学习资源相关
  VIEW_PASTPAPER_TEXTBOOKS: 'view_pastpaper_textbooks',
  VIEW_BOOK_LOCKER: 'view_book_locker',
  
  // 警告相关
  VIEW_WARNINGS: 'view_warnings',
  
  // 校园卡相关
  VIEW_CARD: 'view_card',
  
  // 投诉相关
  FILE_COMPLAINT: 'file_complaint',
  
  // 个人资料相关
  EDIT_PROFILE: 'edit_profile',
  MY_PROFILE: 'my_profile',
  
  // 新增功能权限
  VIEW_WEEKEND_PLAN: 'view_weekend_plan',
  VIEW_CERTIFICATE_APPLY: 'view_certificate_apply',
  VIEW_EXIT_PERMIT: 'view_exit_permit',
  VIEW_CLASS_SIGNUP: 'view_class_signup',
  VIEW_SERVICE: 'view_service',
  VIEW_LATE_CASHIN: 'view_late_cashin',
  VIEW_REMARKING: 'view_remarking',
  VIEW_EXAM_WITHDRAWAL: 'view_exam_withdrawal',
  VIEW_SCORE_REPORT: 'view_score_report',
  TEST_SCORE: 'test_score',
  VIEW_TEXTBOOK: 'view_textbook',
  VIEW_NOTIFICATION: 'view_notification',
  VIEW_EXAM_SIGNUP: 'view_exam_signup',
  MY_TEST: 'my_test',
  INTERVIEW: 'interview'
} as const;

export interface Menu {
  name: string;
  path: string;
  icon?: React.ElementType;
  permission?: string;
  children?: Menu[];
}

export interface UserRole {
  id: string;
  name: string;
  permissions: string[];
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
} 