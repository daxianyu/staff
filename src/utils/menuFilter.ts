import { PERMISSIONS, OPERATION_RIGHTS } from '@/types/auth';
import { MenuItem, UserInfo } from '@/types/permission';

/**
 * 菜单过滤工具类
 */
export class MenuFilter {
  private userRights: string[];
  private user: UserInfo | null;
  
  constructor(userRights: string[], user: UserInfo | null) {
    this.userRights = userRights;
    this.user = user;
  }
  
  /**
   * 检查用户是否有权限访问菜单项
   * @param menuItem 菜单项
   * @returns 是否有权限
   */
  private hasPermission(menuItem: MenuItem): boolean {
    const { requiredPermissions, requiredAllPermissions } = menuItem;
    
    // 没有权限要求，允许访问
    if (!requiredPermissions && !requiredAllPermissions) {
      return true;
    }
    
    // 检查 requiredPermissions (任意一个满足)
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasAnyPermission = requiredPermissions.some(permission => 
        this.checkPermission(permission)
      );
      if (!hasAnyPermission) {
        return false;
      }
    }
    
    // 检查 requiredAllPermissions (全部满足)
    if (requiredAllPermissions && requiredAllPermissions.length > 0) {
      const hasAllPermissions = requiredAllPermissions.every(permission => 
        this.checkPermission(permission)
      );
      if (!hasAllPermissions) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * 检查单个权限（使用新的权限逻辑）
   * @param permission 权限字符串
   * @returns 是否有权限
   */
  private checkPermission(permission: string): boolean {
    if (!this.user) return false;
    
    // 根据权限文档检查特殊权限
    // 兼容后端返回 core_user 为字符串/数字/布尔
    const isCoreUser = Number((this.user as any).core_user) === 1 || (this.user as any).core_user === true;
    const operationRights = Array.isArray(this.user.operation_right) ? this.user.operation_right : [];
    
    // 核心用户拥有所有权限
    if (isCoreUser) return true;
    
    // 检查基础权限（字符串权限）
    if (this.userRights.includes(permission)) return true;
    
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
    
    // 需要 operation_right为17 或 core_user=1 的权限
    const weekendPlanPermissions = [
      PERMISSIONS.VIEW_WEEKEND_PLAN,
      PERMISSIONS.EDIT_WEEKEND_PLAN,
    ];
    if (weekendPlanPermissions.includes(permission as any)) {
      return operationRights.includes(OPERATION_RIGHTS.WEEKEND_PLAN);
    }
    
    // 需要 operation_right为21 或 core_user=1 的权限
    const warningPermissions = [
      PERMISSIONS.VIEW_WARNING_OVERVIEW,
      PERMISSIONS.EDIT_WARNING_OVERVIEW,
    ];
    if (warningPermissions.includes(permission as any)) {
      return operationRights.includes(OPERATION_RIGHTS.WARNING_MANAGEMENT);
    }
    
    // 需要 operation_right为22 或 core_user=1 的权限
    const weekendSpecialDatePermissions = [
      PERMISSIONS.VIEW_WEEKEND_SPECIAL_DATE,
      PERMISSIONS.EDIT_WEEKEND_SPECIAL_DATE,
    ];
    if (weekendSpecialDatePermissions.includes(permission as any)) {
      return operationRights.includes(OPERATION_RIGHTS.WEEKEND_SPECIAL_DATE);
    }
    
    // 需要 tool_user 权限
    const toolUserPermissions = [
      PERMISSIONS.VIEW_FREE_SEARCH,
    ];
    if (toolUserPermissions.includes(permission as any)) {
      return this.userRights.includes('tool_user');
    }
    
    // 需要 edit_classes 或 sales_admin 权限
    const selfSignupPermissions = [
      PERMISSIONS.VIEW_SELF_SIGNUP_CLASSES,
      PERMISSIONS.EDIT_SELF_SIGNUP_CLASSES,
    ];
    if (selfSignupPermissions.includes(permission as any)) {
      return this.userRights.includes('edit_classes') || this.userRights.includes('sales_admin');
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
    ];
    if (basicPermissions.includes(permission as any)) {
      return true; // 所有staff用户都可以访问
    }
    
    return false;
  }
  
  /**
   * 过滤菜单项
   * @param menuItems 菜单项数组
   * @returns 过滤后的菜单项数组
   */
  public filterMenuItems(menuItems: MenuItem[]): MenuItem[] {
    return menuItems.reduce((filtered: MenuItem[], item) => {
      // 检查当前项是否有权限
      if (!this.hasPermission(item)) {
        return filtered;
      }
      
      // 处理子菜单
      const filteredItem: MenuItem = { ...item };
      if (item.children && item.children.length > 0) {
        filteredItem.children = this.filterMenuItems(item.children);
        
        // 如果子菜单全部被过滤掉，且当前项没有path，则不显示当前项
        if (filteredItem.children.length === 0 && !item.path) {
          return filtered;
        }
      }
      
      filtered.push(filteredItem);
      return filtered;
    }, []);
  }
}

/**
 * 创建菜单过滤器
 * @param user 用户信息
 * @returns 菜单过滤器实例
 */
export function createMenuFilter(user: UserInfo | null): MenuFilter {
  // 确保 rights 和 operation_right 是数组
  const rights = Array.isArray(user?.rights) ? user.rights : [];
  const operationRight = Array.isArray(user?.operation_right) ? user.operation_right.map(String) : [];
  const userRights = [...rights, ...operationRight, ...(user?.tool_user ? [PERMISSIONS.VIEW_COMMITMENT, PERMISSIONS.EDIT_COMMITMENT] : [])];
  return new MenuFilter(userRights, user);
}

/**
 * 过滤菜单项的便捷函数
 * @param menuItems 菜单项数组
 * @param user 用户信息
 * @returns 过滤后的菜单项数组
 */
export function filterMenuItems(menuItems: MenuItem[], user: UserInfo | null): MenuItem[] {
  const filter = createMenuFilter(user);
  return filter.filterMenuItems(menuItems);
}

/**
 * 默认菜单配置
 */
export const defaultMenuConfig: MenuItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'dashboard',
    // Dashboard doesn't require special permissions, all users can access
  },
  {
    key: 'staff',
    label: 'Staff Management',
    icon: 'users',
    requiredPermissions: ['view_staff'],
    children: [
      {
        key: 'staff-list',
        label: 'Staff List',
        path: '/staff',
        icon: 'user-group',
        requiredPermissions: ['view_staff'],
      },
      {
        key: 'schedule',
        label: 'Schedule',
        path: '/schedule',
        icon: 'calendar',
        requiredPermissions: ['edit_staff'], // Keep your permission settings
      },
      {
        key: 'invigilate-summary',
        label: 'Invigilate Summary',
        path: '/staff/invigilate-summary',
        icon: 'clipboard-document-list',
        requiredPermissions: ['view_staff'],
      },
    ],
  },
  {
    key: 'students',
    label: 'Student Management',
    icon: 'graduation-cap',
    requiredPermissions: ['view_students'],
    children: [
      {
        key: 'students-list',
        label: 'Student List',
        path: '/students',
        icon: 'user-group',
        requiredPermissions: ['view_students'],
      },
        {
          key: 'lesson-table',
          label: 'Lesson Table',
          path: '/lesson-table',
          icon: 'table',
          requiredPermissions: ['view_lesson_table'],
        },
    ],
  },
  {
    key: 'classes',
    label: 'Class Management',
    icon: 'book',
    requiredPermissions: ['view_classes'],
    children: [
      {
        key: 'classes-list',
        label: 'Class List',
        path: '/class',
        icon: 'book',
        requiredPermissions: ['view_classes'],
      },
    ],
  },
  {
    key: 'exams',
    label: 'Exam Management',
    icon: 'clipboard-document-list',
    requiredPermissions: ['edit_exams'],
    children: [
      {
        key: 'exams-list',
        label: 'Exam List',
        path: '/exam',
        icon: 'clipboard-document-list',
        requiredPermissions: ['edit_exams'],
      },
    ],
  },
  {
    key: 'classrooms',
    label: 'Classroom Manage',
    icon: 'building',
    requiredPermissions: ['view_classrooms'],
    children: [
      {
        key: 'classrooms-list',
        label: 'Classroom List',
        path: '/classroom',
        icon: 'building-office',
        requiredPermissions: ['view_classrooms'],
      },
    ],
  },
  {
    key: 'services',
    label: 'Service Management',
    icon: 'home',
    requiredPermissions: ['view_dormitory'],
    children: [
      {
        key: 'services-list',
        label: 'Dormitory Services',
        path: '/service',
        icon: 'home',
        requiredPermissions: ['view_dormitory'],
      },
      {
        key: 'lockers',
        label: 'Locker Management',
        path: '/locker',
        icon: 'building-office',
        requiredPermissions: ['view_locker'],
      },
      {
        key: 'locker-return',
        label: 'Locker Return',
        path: '/locker-return',
        icon: 'clipboard-document-list',
        requiredPermissions: [PERMISSIONS.VIEW_RETURN_LOCKER],
      },
      {
        key: 'commitment-management',
        label: 'Commitment Manage',
        path: '/commitment',
        icon: 'clipboard-document-list',
        requiredPermissions: [PERMISSIONS.VIEW_COMMITMENT],
      },
      {
        key: 'textbook-management',
        label: 'Textbook Manage',
        path: '/textbook',
        icon: 'book',
        requiredPermissions: ['edit_books'],
      },
    ],
  },
  {
    key: 'accounting',
    label: 'Accounting',
    icon: 'calculator',
    requiredPermissions: ['finance', 'sales_person'],
    children: [
      {
        key: 'finance-students',
        label: 'Finance Students',
        path: '/accounting/finance-students',
        icon: 'user-group',
        requiredPermissions: ['finance', 'sales_person'],
      },
      {
        key: 'disabled-students',
        label: 'Disabled Students',
        path: '/accounting/disabled-students',
        icon: 'user-group',
        requiredPermissions: ['finance', 'sales_person'],
      },
    ],
  },
  {
    key: 'users',
    label: 'Users',
    icon: 'user',
    children: [
      {
        key: 'subject-evaluate',
        label: 'My Subject Evaluate',
        path: '/users/subject-evaluate',
        icon: 'clipboard-document-list',
        requiredPermissions: [PERMISSIONS.VIEW_SUBJECT_EVALUATE],
      },
      {
        key: 'exit-permit',
        label: 'Exit Permit',
        path: '/users/exit-permit',
        icon: 'map-pin',
        requiredPermissions: [PERMISSIONS.VIEW_EXIT_PERMIT],
      },
      {
        key: 'ps-polish',
        label: 'PS Polish',
        path: '/users/ps-polish',
        icon: 'book',
        requiredPermissions: [PERMISSIONS.VIEW_PS_POLISH],
      },
      {
        key: 'withdrawal-overview',
        label: 'Withdrawal Overview',
        path: '/users/withdrawal-overview',
        icon: 'clipboard-document-list',
        requiredPermissions: [PERMISSIONS.VIEW_WITHDRAWAL_OVERVIEW],
      },
      {
        key: 'remark-overview',
        label: 'Remark Overview',
        path: '/users/remark-overview',
        icon: 'clipboard-document-list',
        requiredPermissions: [PERMISSIONS.VIEW_REMARK_OVERVIEW],
      },
      {
        key: 'late-cashin-overview',
        label: 'Late Cashin Overview',
        path: '/users/late-cashin-overview',
        icon: 'calculator',
        requiredPermissions: [PERMISSIONS.VIEW_LATE_CASHIN_OVERVIEW],
      },
      {
        key: 'graduation-wishes',
        label: 'My Graduation Wishes',
        path: '/users/graduation-wishes',
        icon: 'graduation-cap',
        requiredPermissions: [PERMISSIONS.VIEW_GRADUATION_WISHES],
      },
      {
        key: 'transcript-apply',
        label: 'Transcript Apply',
        path: '/users/transcript-apply',
        icon: 'clipboard-document-list',
        requiredPermissions: [PERMISSIONS.VIEW_TRANSCRIPT_APPLY],
      },
      {
        key: 'promote-comment',
        label: 'Promote Comment',
        path: '/users/promote-comment',
        icon: 'user-group',
        requiredPermissions: [PERMISSIONS.VIEW_PROMOTE_COMMENT],
      },
      {
        key: 'my-card',
        label: 'My Card',
        path: '/users/my-card',
        icon: 'dollar-sign',
        requiredPermissions: [PERMISSIONS.VIEW_MY_CARD],
      },
      {
        key: 'schedule',
        label: 'Schedule',
        path: '/schedule',
        icon: 'calendar',
        requiredPermissions: [PERMISSIONS.VIEW_SCHEDULE],
      },
      {
        key: 'profile',
        label: 'Profile',
        path: '/users/profile',
        icon: 'user',
        requiredPermissions: [PERMISSIONS.VIEW_STAFF],
      },
      // {
      //   key: 'permission-test',
      //   label: 'Permission Test',
      //   path: '/users/permission-test',
      //   icon: 'clipboard-document-list',
      //   requiredPermissions: [PERMISSIONS.VIEW_STAFF],
      // },
    ],
  },
  {
    key: 'card-info',
    label: 'Card Info',
    icon: 'dollar-sign',
    requiredPermissions: [PERMISSIONS.VIEW_CARD_BIND],
    children: [
      {
        key: 'bind-overview',
        label: 'Bind Overview',
        path: '/card/bind-overview',
        icon: 'user-group',
        requiredPermissions: [PERMISSIONS.VIEW_CARD_BIND],
      },
      {
        key: 'check-consume',
        label: 'Check Consume',
        path: '/card/check-consume',
        icon: 'calculator',
        requiredPermissions: [PERMISSIONS.VIEW_CARD_CONSUME],
      },
    ],
  },
  {
    key: 'master-admin',
    label: 'Master Admin',
    icon: 'settings',
    requiredPermissions: [PERMISSIONS.VIEW_COMPLAINTS, PERMISSIONS.VIEW_SET_SIGNUP_TIME, PERMISSIONS.EDIT_CAMPUSES, PERMISSIONS.VIEW_TOPICS],
    children: [
      {
        key: 'complaints',
        label: 'View Complaints',
        path: '/master/complaints',
        icon: 'clipboard-document-list',
        requiredPermissions: [PERMISSIONS.VIEW_COMPLAINTS],
      },
      {
        key: 'signup-time',
        label: 'Set Signup Time',
        path: '/master/signup-time',
        icon: 'calendar',
        requiredPermissions: [PERMISSIONS.VIEW_SET_SIGNUP_TIME],
      },
      {
        key: 'campuses',
        label: 'Campuses',
        path: '/master/campuses',
        icon: 'building',
        requiredPermissions: [PERMISSIONS.EDIT_CAMPUSES],
      },
      {
        key: 'topics',
        label: 'Class Topics',
        path: '/master/topics',
        icon: 'book',
        requiredPermissions: [PERMISSIONS.VIEW_TOPICS],
      },
    ],
  },
  {
    key: 'stas',
    label: 'STAS',
    icon: 'chart',
    requiredPermissions: [PERMISSIONS.VIEW_STAS, PERMISSIONS.VIEW_CENTER_LIST, PERMISSIONS.VIEW_TEACHER_HOURS, PERMISSIONS.VIEW_SUBJECT_RELATIVE, PERMISSIONS.VIEW_CLASSROOM_USAGE, PERMISSIONS.VIEW_STUDENT_ATTENDANCE],
    children: [
      {
        key: 'center-list',
        label: 'Center List',
        path: '/stas/center-list',
        icon: 'building',
        requiredPermissions: [PERMISSIONS.VIEW_CENTER_LIST, 'finance'],
      },
      {
        key: 'mentee-dashboard',
        label: 'Mentee Dashboard',
        path: '/stas/mentee-dashboard',
        icon: 'user-group',
        requiredPermissions: [PERMISSIONS.VIEW_MENTEE_DASHBOARD, 'sales_person', 'finance'],
      },
      {
        key: 'mentor-dashboard',
        label: 'Mentor Dashboard',
        path: '/stas/mentor-dashboard',
        icon: 'users',
        requiredPermissions: [PERMISSIONS.VIEW_MENTOR_DASHBOARD, 'sales_person', 'finance'],
      },
      {
        key: 'teacher-hours',
        label: 'Teacher Hours',
        path: '/stas/teacher-hours',
        icon: 'clock',
        requiredPermissions: [PERMISSIONS.VIEW_TEACHER_HOURS, 'finance', PERMISSIONS.VIEW_STAS],
      },
      {
        key: 'subject-relative',
        label: 'Subject Relative',
        path: '/stas/subject-relative',
        icon: 'book',
        requiredPermissions: [PERMISSIONS.VIEW_SUBJECT_RELATIVE, 'finance', PERMISSIONS.VIEW_STAS],
      },
      {
        key: 'subject-relative-monthly',
        label: 'Subject Relative Monthly',
        path: '/stas/subject-relative-monthly',
        icon: 'calendar',
        requiredPermissions: [PERMISSIONS.VIEW_SUBJECT_RELATIVE_MONTHLY, 'finance', PERMISSIONS.VIEW_STAS],
      },
      {
        key: 'student-fullness',
        label: 'Student Fullness',
        path: '/stas/student-fullness',
        icon: 'graduation-cap',
        requiredPermissions: [PERMISSIONS.VIEW_STUDENT_FULLNESS, 'finance', PERMISSIONS.VIEW_STAS],
      },
      {
        key: 'classroom-usage',
        label: 'Classroom Usage',
        path: '/stas/classroom-usage',
        icon: 'building-office',
        requiredPermissions: [PERMISSIONS.VIEW_CLASSROOM_USAGE, 'view_day_overview', 'finance', PERMISSIONS.VIEW_STAS],
      },
      {
        key: 'teacher-monthly-hours',
        label: 'Teacher Monthly Hours',
        path: '/stas/teacher-monthly-hours',
        icon: 'calendar',
        requiredPermissions: [PERMISSIONS.VIEW_TEACHER_MONTHLY_HOURS, 'finance', 'core_admin'],
      },
      {
        key: 'student-monthly-hours',
        label: 'Student Monthly Hours',
        path: '/stas/student-monthly-hours',
        icon: 'calendar',
        requiredPermissions: [PERMISSIONS.VIEW_STUDENT_MONTHLY_HOURS, 'finance', 'core_admin'],
      },
      {
        key: 'student-attendance',
        label: 'Student Attendance',
        path: '/stas/student-attendance',
        icon: 'clipboard-document-list',
        requiredPermissions: [PERMISSIONS.VIEW_STUDENT_ATTENDANCE],
      },
    ],
  },
  {
    key: 'school-admin',
    label: 'School Admin',
    icon: 'building-office',
    requiredPermissions: [
      PERMISSIONS.VIEW_WARNING_OVERVIEW,
      PERMISSIONS.VIEW_WEEKEND_PLAN,
      PERMISSIONS.VIEW_WEEKEND_SPECIAL_DATE,
      PERMISSIONS.VIEW_FREE_SEARCH,
      PERMISSIONS.VIEW_SELF_SIGNUP_CLASSES,
      'view_staff',
      'view_students',
      'view_classes',
      'edit_exams',
      'sms',
      'edit_books',
      'edit_tests',
      'edit_surveys',
      'view_dormitory',
      'view_locker',
    ],
    children: [
      {
        key: 'school-staff',
        label: 'Staff',
        path: '/school-admin/staff',
        icon: 'users',
        requiredPermissions: ['view_staff'],
      },
      {
        key: 'school-students',
        label: 'Students',
        path: '/school-admin/students',
        icon: 'graduation-cap',
        requiredPermissions: ['view_students'],
      },
      {
        key: 'school-parents',
        label: 'Parents',
        path: '/school-admin/parents',
        icon: 'user-group',
        requiredPermissions: ['view_students'],
      },
      {
        key: 'school-classes',
        label: 'Classes',
        path: '/school-admin/classes',
        icon: 'book',
        requiredPermissions: ['view_classes'],
      },
      {
        key: 'self-signup-classes',
        label: 'Self Signup Classes',
        path: '/school-admin/self-signup-classes',
        icon: 'plus-circle',
        requiredPermissions: [PERMISSIONS.VIEW_SELF_SIGNUP_CLASSES],
      },
      {
        key: 'group-assignment-requests',
        label: 'Group Assignment Requests',
        path: '/school-admin/group-assignment-requests',
        icon: 'user-group',
        requiredPermissions: ['view_classes'],
      },
      {
        key: 'school-subjects',
        label: 'Subjects',
        path: '/school-admin/subjects',
        icon: 'book',
        requiredPermissions: ['view_classes'],
      },
      {
        key: 'school-classrooms',
        label: 'Classrooms',
        path: '/school-admin/classrooms',
        icon: 'building',
        requiredPermissions: ['view_classrooms'],
      },
      {
        key: 'school-exams',
        label: 'Exams',
        path: '/school-admin/exams',
        icon: 'clipboard-document-list',
        requiredPermissions: ['edit_exams'],
      },
      {
        key: 'school-sms',
        label: 'SMS',
        path: '/school-admin/sms',
        icon: 'chat-bubble-left-right',
        requiredPermissions: ['sms'],
      },
      {
        key: 'dormitory-sms',
        label: 'Dormitory SMS',
        path: '/school-admin/dormitory-sms',
        icon: 'home',
        requiredPermissions: ['sms'],
      },
      {
        key: 'school-textbooks',
        label: 'Textbooks',
        path: '/school-admin/textbooks',
        icon: 'book',
        requiredPermissions: ['edit_books'],
      },
      {
        key: 'edit-tests',
        label: 'Edit Tests',
        path: '/school-admin/edit-tests',
        icon: 'clipboard-document-list',
        requiredPermissions: ['edit_tests'],
      },
      {
        key: 'edit-surveys',
        label: 'Edit Surveys',
        path: '/school-admin/edit-surveys',
        icon: 'clipboard-document-list',
        requiredPermissions: ['edit_surveys'],
      },
      {
        key: 'school-services',
        label: 'Services',
        path: '/school-admin/services',
        icon: 'home',
        requiredPermissions: ['view_dormitory'],
      },
      {
        key: 'school-lockers',
        label: 'Lockers',
        path: '/school-admin/lockers',
        icon: 'building-office',
        requiredPermissions: ['view_locker'],
      },
      {
        key: 'mentor-profile',
        label: 'MentorProfile',
        path: '/school-admin/mentor-profile',
        icon: 'user',
        requiredPermissions: ['view_staff'],
      },
      {
        key: 'transcript-manager',
        label: 'Transcript Manager',
        path: '/school-admin/transcript-manager',
        icon: 'clipboard-document-list',
        requiredPermissions: ['view_students'],
      },
      {
        key: 'polish-overview',
        label: 'Polish Overview',
        path: '/school-admin/polish-overview',
        icon: 'book',
        requiredPermissions: [PERMISSIONS.VIEW_PS_POLISH],
      },
      {
        key: 'certificate-overview',
        label: 'Certificate Overview',
        path: '/school-admin/certificate-overview',
        icon: 'clipboard-document-list',
        requiredPermissions: ['view_students'],
      },
      {
        key: 'locker-return-overview',
        label: 'Locker Return Overview',
        path: '/school-admin/locker-return-overview',
        icon: 'building-office',
        requiredPermissions: ['view_locker'],
      },
      {
        key: 'free-search',
        label: 'Free Search',
        path: '/school-admin/free-search',
        icon: 'magnifying-glass',
        requiredPermissions: [PERMISSIONS.VIEW_FREE_SEARCH],
      },
      {
        key: 'warning-overview',
        label: 'Warning Overview',
        path: '/school-admin/warning-overview',
        icon: 'exclamation-triangle',
        requiredPermissions: [PERMISSIONS.VIEW_WARNING_OVERVIEW],
      },
      {
        key: 'weekend-plan-overview',
        label: 'Weekend Plan Overview',
        path: '/school-admin/weekend-plan-overview',
        icon: 'calendar',
        requiredPermissions: [PERMISSIONS.VIEW_WEEKEND_PLAN],
      },
      {
        key: 'weekend-special-date',
        label: 'Weekend Special Date',
        path: '/school-admin/weekend-special-date',
        icon: 'calendar-days',
        requiredPermissions: [PERMISSIONS.VIEW_WEEKEND_SPECIAL_DATE],
      },
    ],
  },
];

/**
 * 获取过滤后的菜单配置
 * @param user 用户信息
 * @returns 过滤后的菜单配置
 */
export function getFilteredMenuConfig(user: UserInfo | null): MenuItem[] {
  return filterMenuItems(defaultMenuConfig, user);
}

/**
 * 根据路径查找菜单项
 * @param menuItems 菜单项数组
 * @param path 路径
 * @returns 找到的菜单项
 */
export function findMenuItemByPath(menuItems: MenuItem[], path: string): MenuItem | null {
  for (const item of menuItems) {
    if (item.path === path) {
      return item;
    }
    if (item.children) {
      const found = findMenuItemByPath(item.children, path);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/**
 * 获取菜单项的面包屑路径
 * @param menuItems 菜单项数组
 * @param path 当前路径
 * @returns 面包屑路径数组
 */
export function getBreadcrumbPath(menuItems: MenuItem[], path: string): MenuItem[] {
  function findPath(items: MenuItem[], targetPath: string, currentPath: MenuItem[] = []): MenuItem[] | null {
    for (const item of items) {
      const newPath = [...currentPath, item];
      
      if (item.path === targetPath) {
        return newPath;
      }
      
      if (item.children) {
        const result = findPath(item.children, targetPath, newPath);
        if (result) {
          return result;
        }
      }
    }
    return null;
  }
  
  return findPath(menuItems, path) || [];
} 
