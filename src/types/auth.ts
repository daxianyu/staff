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
  
  // Demo页面
  VIEW_DEMO: 'view_demo',
  CREATE_DEMO: 'create_demo',
  EDIT_DEMO: 'edit_demo',
  DELETE_DEMO: 'delete_demo',
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