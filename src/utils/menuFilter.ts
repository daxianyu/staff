import { PERMISSIONS } from '@/types/auth';
import { MenuItem, UserInfo } from '@/types/permission';

/**
 * 菜单过滤工具类
 */
export class MenuFilter {
  private userRights: string[];
  
  constructor(userRights: string[]) {
    this.userRights = userRights;
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
        this.userRights.includes(permission)
      );
      if (!hasAnyPermission) {
        return false;
      }
    }
    
    // 检查 requiredAllPermissions (全部满足)
    if (requiredAllPermissions && requiredAllPermissions.length > 0) {
      const hasAllPermissions = requiredAllPermissions.every(permission => 
        this.userRights.includes(permission)
      );
      if (!hasAllPermissions) {
        return false;
      }
    }
    
    return true;
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
  const operationRight = Array.isArray(user?.operation_right) ? user.operation_right : [];
  const userRights = [...rights, ...operationRight, ...(user?.tool_user ? [PERMISSIONS.VIEW_COMMITMENT, PERMISSIONS.EDIT_COMMITMENT] : [])];
  return new MenuFilter(userRights);
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
    key: 'demo',
    label: 'Demo Page',
    path: '/demo',
    icon: 'table',
    requiredPermissions: ['view_demo'],
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
    key: 'system',
    label: 'System Management',
    icon: 'settings',
    requiredPermissions: ['core_admin'],
    children: [
      {
        key: 'campuses',
        label: 'Campus Management',
        path: '/system/campuses',
        icon: 'map-pin',
        requiredPermissions: ['edit_campuses'],
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