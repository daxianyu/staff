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
  const userRights = user ? [...user.rights, ...user.operation_right] : [];
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
    label: '仪表盘',
    path: '/dashboard',
    icon: 'dashboard',
    // 仪表盘不需要特殊权限，所有用户都可以访问
  },
  {
    key: 'schedule',
    label: '课程安排',
    path: '/schedule',
    icon: 'calendar',
    requiredPermissions: ['edit_staff'], // 保持你设置的权限
  },
  {
    key: 'demo',
    label: 'Demo页面',
    path: '/demo',
    icon: 'table',
    requiredPermissions: ['view_demo'],
  },
  {
    key: 'staff',
    label: '员工管理',
    icon: 'users',
    requiredPermissions: ['view_staff'],
    children: [
      {
        key: 'staff-list',
        label: '员工列表',
        path: '/staff',
        requiredPermissions: ['view_staff'],
      },
      {
        key: 'staff-create',
        label: '新增员工',
        path: '/staff/create',
        requiredPermissions: ['create_staff'],
      },
      {
        key: 'staff-contact',
        label: '员工联系方式',
        path: '/staff/contact',
        requiredPermissions: ['view_staff_contact'],
      },
    ],
  },
  {
    key: 'classes',
    label: '课程管理',
    icon: 'book',
    requiredPermissions: ['view_classes'],
    children: [
      {
        key: 'classes-list',
        label: '课程列表',
        path: '/classes',
        requiredPermissions: ['view_classes'],
      },
      {
        key: 'classes-create',
        label: '新增课程',
        path: '/classes/create',
        requiredPermissions: ['edit_classes'],
      },
    ],
  },
  {
    key: 'classrooms',
    label: '教室管理',
    icon: 'building',
    requiredPermissions: ['view_classrooms'],
    children: [
      {
        key: 'classrooms-list',
        label: '教室列表',
        path: '/classrooms',
        requiredPermissions: ['view_classrooms'],
      },
      {
        key: 'classrooms-create',
        label: '新增教室',
        path: '/classrooms/create',
        requiredPermissions: ['edit_classrooms'],
      },
    ],
  },
  {
    key: 'finance',
    label: '财务管理',
    icon: 'dollar-sign',
    requiredPermissions: ['finance', 'view_accounting'],
    children: [
      {
        key: 'accounting',
        label: '账务管理',
        path: '/finance/accounting',
        requiredPermissions: ['view_accounting'],
      },
      {
        key: 'non-credit-accounting',
        label: '非学分账务',
        path: '/finance/non-credit',
        requiredPermissions: ['view_non_credit_based_accounting'],
      },
    ],
  },
  {
    key: 'system',
    label: '系统管理',
    icon: 'settings',
    requiredPermissions: ['core_admin'],
    children: [
      {
        key: 'logs',
        label: '操作日志',
        path: '/system/logs',
        requiredPermissions: ['view_log'],
      },
      {
        key: 'campuses',
        label: '校区管理',
        path: '/system/campuses',
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