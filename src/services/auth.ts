interface LoginParams {
  username: string;
  password: string;
}

interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data?: T; // 数据类型
  token?: string;
}

interface ChangePasswordParams {
  old_password: string;
  new_password: string;
}

export interface Exam {
  student_names: string[];
  exam_name: string;
  day_str: string;
  week_str: string;
  day: number;
}

export interface Lesson {
  lesson_id: string;
  start_time: string;
  end_time: string;
  teacher: string;
  subject_name: string;
  room_name: string;
  topic_name: string;
  students: string[];
  class_id: string;
  class_name: string;
}

export interface ScheduleResponse {
  status: number;
  message: string;
  data: {
    student_exam: Record<string, Exam[]>;
    special_day: any[]; // TODO: 根据实际类型定义
    lessons: Lesson[];
  }
}

// 销售信息接口定义
interface SalesInfoResponse {
  info_sign: number;
  [key: string]: any;  // 其他可能的字段
}

// 员工管理相关接口定义
export interface Staff {
  staff_id: number;
  name: string;
  group_name: string;
  campus: string;
  email?: string;
  phone?: string;
  position?: string;
  status?: number; // 0-离职, 1-在职
  created_at?: string;
  updated_at?: string;
}

export interface StaffFormData {
  first_name: string;
  last_name: string;
  phone_0: string;
  phone_1: string;
  email: string;
  campus_id: number;
}

// 保留原有的用于显示的接口
export interface StaffDisplayData {
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  campus: string;
  status: number;
}

export interface TeacherAvailability {
  staff_id: number;
  availability_type: number; // 0-teacher_default_schedule的空闲  1-teacher_schedule的空闲  2-lesson的占用
  schedule_data: any[];
}

export interface TeacherSchedule {
  staff_id: number;
  week_num: number;
  schedule_data: any[];
}

// 获取存储的token
const getAuthHeader = (): HeadersInit => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': token } : {};
  }
  return {};
};

export const login = async (params: LoginParams): Promise<ApiResponse> => {
  try {
    console.log('登录请求参数:', params);
    console.log('登录请求URL:', '/api/login');
    
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    console.log('登录响应状态:', response.status);
    console.log('登录响应结果:', data);
    
    // 返回完整的响应数据，让调用方决定如何处理
    return {
      code: data.status === 0 ? 200 : response.status,
      message: data.message || '',
      data: data.data,
      token: data.token,
    };
  } catch (error) {
    console.error('登录异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '登录失败',
    };
  }
};

export const logout = async (): Promise<ApiResponse> => {
  try {
    console.log('退出请求URL:', '/api/logout');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/logout', {
      method: 'POST',
      headers,
    });
    
    const data = await response.json();
    console.log('退出响应状态:', response.status);
    console.log('退出响应结果:', data);

    // 清除本地存储的token
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('退出异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '退出失败',
    };
  }
};

export const getUserInfo = async (): Promise<ApiResponse> => {
  try {
    console.log('获取用户信息请求URL:', '/api/public/user_info');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/public/user_info', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    console.log('获取用户信息响应状态:', response.status);
    console.log('获取用户信息响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400, // 非0状态返回400错误码
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取用户信息异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取用户信息失败',
    };
  }
};

export const getStudentSalesInfo = async (): Promise<ApiResponse> => {
  try {
    console.log('获取学生sales信息请求URL:', '/api/sales/get_student_sales_info');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/sales/get_student_sales_info', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    console.log('获取学生sales信息响应状态:', response.status);
    console.log('获取学生sales信息响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取学生sales信息异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取学生sales信息失败',
    };
  }
};


// 用户登录后重定向路由处理函数
export const handleUserRedirect = async (userData: any, router: any, useWindowLocation = false) => {
  if (!userData) return;

  try {
    // pre_student用户(type=4)特殊处理
    if (userData.type === 4) {
      // 获取销售信息检查info_sign状态
      const salesInfoResp = await getStudentSalesInfo();
      
      if (salesInfoResp.code === 200) {
        const salesInfo = salesInfoResp.data as SalesInfoResponse;
        const targetPath = salesInfo.info_sign === 0 ? '/my-profile' : '/my-test';
        
        // 根据传入参数决定使用router还是window.location
        if (useWindowLocation) {
          window.location.href = targetPath;
        } else {
          router.push(targetPath);
        }
      } else {
        // 获取销售信息失败，默认导向my-profile
        if (useWindowLocation) {
          window.location.href = '/student/my-profile';
        } else {
          router.push('/my-profile');
        }
      }
    } else {
      // 其他用户类型导向notification
      if (useWindowLocation) {
        window.location.href = '/notification';
      } else {
        router.push('/notification');
      }
    }
  } catch (error) {
    console.error('处理用户重定向异常:', error);
    // 出错时默认导向通知页面
    if (useWindowLocation) {
      window.location.href = '/notification';
    } else {
      router.push('/notification');
    }
  }
};

// =============员工管理相关API函数=============

// 获取员工列表
export const getStaffList = async (searchParams?: { 
  status?: number; 
  name?: string; 
  page?: number; 
  limit?: number; 
}): Promise<ApiResponse> => {
  try {
    const params = new URLSearchParams();
    if (searchParams) {
      if (searchParams.status !== undefined) params.append('status', searchParams.status.toString());
      if (searchParams.name) params.append('name', searchParams.name);
      if (searchParams.page) params.append('page', searchParams.page.toString());
      if (searchParams.limit) params.append('limit', searchParams.limit.toString());
    }
    
    const url = `/api/staff/list${params.toString() ? `?${params.toString()}` : ''}`;
    console.log('获取员工列表请求URL:', url);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    console.log('获取员工列表响应状态:', response.status);
    console.log('获取员工列表响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取员工列表异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取员工列表失败',
    };
  }
};

// 添加员工
export const addStaff = async (staffData: StaffFormData): Promise<ApiResponse> => {
  try {
    console.log('添加员工请求参数:', staffData);
    console.log('添加员工请求URL:', '/api/staff/add');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/staff/add', {
      method: 'POST',
      headers,
      body: JSON.stringify(staffData),
    });
    
    const data = await response.json();
    console.log('添加员工响应状态:', response.status);
    console.log('添加员工响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('添加员工异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '添加员工失败',
    };
  }
};

// 编辑员工
export const editStaff = async (staffId: number, staffData: StaffFormData): Promise<ApiResponse> => {
  try {
    const requestData = { ...staffData, id: staffId };
    console.log('编辑员工请求参数:', requestData);
    console.log('编辑员工请求URL:', '/api/staff/edit');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/staff/edit', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData),
    });
    
    const data = await response.json();
    console.log('编辑员工响应状态:', response.status);
    console.log('编辑员工响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('编辑员工异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '编辑员工失败',
    };
  }
};

// 删除员工
export const deleteStaff = async (staffId: number): Promise<ApiResponse> => {
  try {
    const requestData = { id: staffId };
    console.log('删除员工请求参数:', requestData);
    console.log('删除员工请求URL:', '/api/staff/delete');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/staff/delete', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData),
    });
    
    const data = await response.json();
    console.log('删除员工响应状态:', response.status);
    console.log('删除员工响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('删除员工异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '删除员工失败',
    };
  }
};

// 禁用员工账户
export const disableStaffAccount = async (staffId: number): Promise<ApiResponse> => {
  try {
    const requestData = { id: staffId };
    console.log('禁用员工账户请求参数:', requestData);
    console.log('禁用员工账户请求URL:', '/api/staff/disable_account');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/staff/disable_account', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData),
    });
    
    const data = await response.json();
    console.log('禁用员工账户响应状态:', response.status);
    console.log('禁用员工账户响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('禁用员工账户异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '禁用员工账户失败',
    };
  }
};

// 获取老师默认可用时间
export const getTeacherDefaultAvailability = async (staffId: number): Promise<ApiResponse> => {
  try {
    const url = `/api/staff/teacher_default_availability/${staffId}`;
    console.log('获取老师默认可用时间请求URL:', url);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    console.log('获取老师默认可用时间响应状态:', response.status);
    console.log('获取老师默认可用时间响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取老师默认可用时间异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取老师默认可用时间失败',
    };
  }
};

// 获取老师课表
export const getTeacherSchedule = async (staffId: number, weekNum: number): Promise<ApiResponse> => {
  try {
    const url = `/api/staff/schedule/${staffId}/${weekNum}`;
    console.log('获取老师课表请求URL:', url);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    console.log('获取老师课表响应状态:', response.status);
    console.log('获取老师课表响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取老师课表异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取老师课表失败',
    };
  }
};

// 课程概览相关接口定义
export interface LessonOverviewData {
  campus_lessons: { [key: string]: number };
  campus_info: { [key: string]: string };
  subjects: { [key: string]: SubjectData };
  total_sum: number;
}

export interface SubjectData {
  class_name: string;
  class_id: number;
  campus_id: number;
  campus_name: string;
  topic_id: number;
  description: string;
  students: number[];
  lessons: LessonData[];
  total_lesson_length: number;
}

export interface LessonData {
  lesson_id: number;
  start_time: number;
  end_time: number;
  feedback_given: number;
}

export const getLessonOverview = async (staffId: string, monthId: string): Promise<ApiResponse> => {
  try {
    console.log('获取课程概览请求URL:', `/api/staff/lesson_overview/${staffId}/${monthId}`);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch(`/api/staff/lesson_overview/${staffId}/${monthId}`, {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    console.log('获取课程概览响应状态:', response.status);
    console.log('获取课程概览响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取课程概览异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取课程概览失败',
    };
  }
};