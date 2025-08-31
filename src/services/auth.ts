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
export const getAuthHeader = (): HeadersInit => {
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
          window.location.href = '/staff/my-profile';
        } else {
          router.push('/my-profile');
        }
      }
    } else {
      // 其他用户类型导向dashboard
      if (useWindowLocation) {
        window.location.href = '/dashboard';
      } else {
        router.push('/dashboard');
      }
    }
  } catch (error) {
    console.error('处理用户重定向异常:', error);
    // 出错时默认导向dashboard页面
    if (useWindowLocation) {
      window.location.href = '/dashboard';
    } else {
      router.push('/dashboard');
    }
  }
};

// =============Dashboard相关API函数=============

// Dashboard数据接口定义
export interface AttendanceListItem {
  start_time: number;
  topic: number;
  topic_name: string;
  subject_id: number;
  students: Array<{
    student_name: string;
    comment: string;
    student_id: number;
    lesson_id: number;
  }>;
}

export interface FeedbackListItem {
  student_id: number;
  subject_id: number;
  student_name: string;
  topic_name: string;
  time_unit: number;
  time_unit_start: number;
  time_unit_end: number;
}

export interface DashboardData {
  attendance_list: AttendanceListItem[];
  feed_back_list: FeedbackListItem[];
}

export interface DashboardResponse {
  status: number;
  message: string;
  data: DashboardData;
}

// 获取员工dashboard数据
export const getStaffDashboard = async (): Promise<ApiResponse<DashboardData>> => {
  try {
    console.log('获取员工dashboard请求URL:', '/api/staff/dashboard');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/staff/dashboard', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    console.log('获取员工dashboard响应状态:', response.status);
    console.log('获取员工dashboard响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取员工dashboard异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取员工dashboard失败',
    };
  }
};

// 更新考勤接口参数 (批量)
export interface UpdateAttendanceParams {
  lesson_id: number;
  attendance_info: Array<{
    student_id: number;
    present: number; // 0: 请假, 1: 旷课, 2: 上网课请假, 3: 上网课旷课, -1: 正常出席
  }>;
}

// 更新反馈接口参数
export interface UpdateFeedbackParams {
  student_id: number;
  subject_id: number;
  time_unit: number;
  feedback_note: string;
}

// 取消课程接口参数
export interface CancelLessonParams {
  record_id: number;
}

// 更新考勤状态
export const updateAttendance = async (params: UpdateAttendanceParams): Promise<ApiResponse> => {
  try {
    console.log('更新考勤请求参数:', params);
    console.log('更新考勤请求URL:', '/api/staff/update_attendance');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/staff/update_attendance', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    console.log('更新考勤响应状态:', response.status);
    console.log('更新考勤响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('更新考勤异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '更新考勤失败',
    };
  }
};

// 更新反馈
export const updateFeedback = async (params: UpdateFeedbackParams): Promise<ApiResponse> => {
  try {
    console.log('更新反馈请求参数:', params);
    console.log('更新反馈请求URL:', '/api/staff/update_feedback');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/staff/update_feedback', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    console.log('更新反馈响应状态:', response.status);
    console.log('更新反馈响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('更新反馈异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '更新反馈失败',
    };
  }
};

// 取消课程
export const cancelLesson = async (params: CancelLessonParams): Promise<ApiResponse> => {
  try {
    console.log('取消课程请求参数:', params);
    console.log('取消课程请求URL:', '/api/staff/cancel_lesson');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/staff/cancel_lesson', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    console.log('取消课程响应状态:', response.status);
    console.log('取消课程响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('取消课程异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '取消课程失败',
    };
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

// 获取启用的员工列表（默认）
export const getActiveStaffList = async (searchParams?: { 
  name?: string; 
  page?: number; 
  limit?: number; 
}): Promise<ApiResponse> => {
  return getStaffList({ ...searchParams, status: 1 });
};

// 获取禁用的员工列表
export const getDisabledStaffList = async (searchParams?: { 
  name?: string; 
  page?: number; 
  limit?: number; 
}): Promise<ApiResponse> => {
  return getStaffList({ ...searchParams, status: 0 });
};

// 获取所有员工列表（包括启用和禁用的）
export const getAllStaffList = async (searchParams?: { 
  name?: string; 
  page?: number; 
  limit?: number; 
}): Promise<ApiResponse> => {
  // 注意：后端接口目前不支持获取所有状态的员工，需要分别获取后合并
  const [activeResponse, disabledResponse] = await Promise.all([
    getActiveStaffList(searchParams),
    getDisabledStaffList(searchParams)
  ]);
  
  if (activeResponse.code === 200 && disabledResponse.code === 200) {
    const activeData = Array.isArray(activeResponse.data) ? activeResponse.data : [];
    const disabledData = Array.isArray(disabledResponse.data) ? disabledResponse.data : [];
    
    return {
      code: 200,
      message: '获取成功',
      data: [...activeData, ...disabledData]
    };
  }
  
  return {
    code: 500,
    message: '获取员工列表失败',
  };
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
export const deleteStaff = async (staffIds: number | number[]): Promise<ApiResponse> => {
  try {
    // 支持单个ID或ID数组，转换为逗号分隔的字符串
    const ids = Array.isArray(staffIds) ? staffIds.join(',') : staffIds.toString();
    const requestData = { ids };
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

// 更新员工账户状态（启用/禁用）
export const updateStaffActiveStatus = async (recordId: number, status: 0 | 1): Promise<ApiResponse> => {
  try {
    const requestData = { 
      record_id: recordId,
      status 
    };
    console.log('更新员工账户状态请求参数:', requestData);
    console.log('更新员工账户状态请求URL:', '/api/staff/update_active');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/staff/update_active', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData),
    });
    
    const data = await response.json();
    console.log('更新员工账户状态响应状态:', response.status);
    console.log('更新员工账户状态响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('更新员工账户状态异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '更新员工账户状态失败',
    };
  }
};

// 禁用员工账户（兼容旧接口）
export const disableStaffAccount = async (staffId: number): Promise<ApiResponse> => {
  return updateStaffActiveStatus(staffId, 0);
};

// 启用员工账户
export const enableStaffAccount = async (staffId: number): Promise<ApiResponse> => {
  return updateStaffActiveStatus(staffId, 1);
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

// 获取员工课表
export const getStaffSchedule = async (staffId: string, weekNum: string): Promise<any> => {
  try {
    const url = `/api/staff/schedule/${staffId}/${weekNum}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('获取员工课表异常:', error);
    return {
      status: 500,
      message: error instanceof Error ? error.message : '获取员工课表失败',
      data: null,
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

// 导师信息相关接口定义
export interface Subject {
  id: number;
  class_id: number;
  subject: string;
  description: string;
  student_count: number;
  teacher_name: string;
  student_names: string[];
  rating: number;
}

export interface StaffInfo {
  total_info: {
    total_lesson_count: number;
    total_lesson_hours: number;
    lesson_this_week: number;
    lesson_this_month: number;
    average_rating: number;
    average_test_result: string;
    result_count: number;
  };
  subject_teacher_feedback_comment: Record<string, any[]>;
  mentee_student_list: string[];
  staff_name: string;
  subjects: Subject[];
}

export const getStaffInfo = async (staffId: string): Promise<ApiResponse<StaffInfo>> => {
  try {
    const url = `/api/staff/staff_info/${staffId}`;
    console.log('获取导师信息请求URL:', url);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    console.log('获取导师信息响应状态:', response.status);
    console.log('获取导师信息响应结果:', data);

    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取导师信息异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取导师信息失败',
    };
  }
};

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

export interface LessonEvent {
  type: 'lesson';
  subject: string;                // 科目
  campus: string;                 // 校区
  pickRoom: string;               // 教室
  replaceRoomWhenBooked: boolean; // 是否自动换教室
  date: string;                   // 日期（如 '2024-07-12'）
  startTime: string;              // 开始时间（如 '09:00'）
  endTime: string;                // 结束时间（如 '10:00'）
}

export interface UnavailableEvent {
  type: 'unavailable';
  date: string;                   // 日期
  startTime: string;              // 开始时间
  endTime: string;                // 结束时间
}

export type ScheduleEvent = LessonEvent | UnavailableEvent;

// 新的API数据结构
/*
课程相关的interface
新增：
event_type = 2
add_lesson = 1
subject_id 
start_time
end_time
room_id

删除
event_type = 2
delete_ids = "lesson_id, lesson_id"

编辑
event_type = 2
change_lesson = 1
subject_id 
start_time
end_time
lesson_id
room_id
*/
export interface LessonEventAPI {
  event_type: 2;
  time_list: Array<{
    lesson_id?: string;
    subject: string;
    campus: string;
    pickRoom: string;
    replaceRoomWhenBooked: boolean;
    date: string;
    start_time: number;
    end_time: number;
  }>;
}

/*
删除相关
event_type = 1 
time_list = [{"start_time": 111, "end_time":222},{"start_time": 111, "end_time":222}]
*/
export interface UnavailableEventAPI {
  event_type: 1;
  week_num: number;
  time_list: Array<{
    start_time: number;
    end_time: number;
  }>;
}

export type ScheduleEventAPI = LessonEventAPI | UnavailableEventAPI;



// /api/staff/update_staff_schedule/{staff_id} 更新老师课表
export async function updateStaffSchedule(staffId: string, scheduleData: any) {
  const url = `/api/staff/update_staff_schedule/${staffId}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
  };
  
  // 直接发送数据，不需要处理time_list
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(scheduleData),
  });
  const data = await response.json();
  return data;
}

// /api/staff/update_staff_unavailable/{staff_id} 更新老师不可用时间
export async function updateStaffUnavailable(staffId: string, unavailableData: UnavailableEventAPI) {
  const url = `/api/staff/update_staff_unavailable/${staffId}`;
  unavailableData.time_list = unavailableData.time_list.map(item => ({
    start_time: item.start_time / 1000,
    end_time: item.end_time / 1000
  }));
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
  };
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(unavailableData),
  });
  const data = await response.json();
  return data;
}

// 员工课表相关接口定义（旧版本，用于员工课表）
export interface StaffAddLessonParams {
  subject_id: string;
  start_time: number; // 时间戳
  end_time: number;   // 时间戳
  room_id: string;
  repeat_num?: number; // 重复次数，默认1
}

// 员工课表编辑课程参数
export interface StaffEditLessonParams {
  lesson_id: string;
  subject_id: string;
  start_time: number; // 时间戳
  end_time: number;   // 时间戳
  room_id: string;
  repeat_num?: number; // 重复次数
}

// 员工课表删除课程参数
export interface StaffDeleteLessonParams {
  lesson_ids: string[];
  repeat_num?: number; // 删除周数
}

// 新增课程
export async function addStaffLesson(staffId: string, params: StaffAddLessonParams) {
  return updateStaffSchedule(staffId, {
    event_type: 2,
    add_lesson: 1,
    ...params
  } as any);
}

// 编辑课程
export async function editStaffLesson(staffId: string, params: StaffEditLessonParams) {
  return updateStaffSchedule(staffId, {
    event_type: 2,
    change_lesson: 1,
    ...params
  } as any);
}

// 删除课程
export async function deleteStaffLesson(staffId: string, params: StaffDeleteLessonParams) {
  return updateStaffSchedule(staffId, {
    event_type: 2,
    delete_ids: params.lesson_ids.join(','),
    repeat_num: params.repeat_num || 1
  } as any);
}

// 监考相关接口定义
export interface AddInvigilateParams {
  staff_id: string;
  start_time: number; // 时间戳
  end_time: number;   // 时间戳
  topic_id: string;
  note: string;
}

export interface EditInvigilateParams {
  record_id: string;
  staff_id: string;
  start_time: number; // 时间戳
  end_time: number;   // 时间戳
  topic_id: string;
  note: string;
}

export interface DeleteInvigilateParams {
  record_id: string;
}

// 添加监考
export async function addStaffInvigilate(params: AddInvigilateParams) {
  try {
    const response = await fetch('/api/staff/add_invigilate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('添加监考失败:', error);
    return { status: -1, message: '添加监考失败' };
  }
}

// 更新监考
export async function updateStaffInvigilate(params: EditInvigilateParams) {
  try {
    const response = await fetch('/api/staff/update_invigilate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('更新监考失败:', error);
    return { status: -1, message: '更新监考失败' };
  }
}

// 删除监考
export async function deleteStaffInvigilate(params: DeleteInvigilateParams) {
  try {
    const response = await fetch('/api/staff/delete_invigilate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('删除监考失败:', error);
    return { status: -1, message: '删除监考失败' };
  }
}

// 监考汇总相关接口
export interface InvigilateInfo {
  record_id: number;
  staff_id: number;
  staff_name: string;
  topic_id: number;
  topic_name: string;
  start_time: number;
  end_time: number;
  note: string;
}

export interface InvigilateSummaryData {
  rows: InvigilateInfo[];
  total: number;
}

export interface InvigilateSummaryResponse {
  status: number;
  message: string;
  data: InvigilateSummaryData;
}

export const getInvigilateSummary = async (params?: {
  month?: string | null;
  year?: string;
}): Promise<InvigilateSummaryResponse> => {
  try {
    const response = await fetch('/api/summary/get_all_invigilate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        month: params?.month || null,
        year: params?.year || new Date().getFullYear().toString()
      })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('获取监考汇总失败:', error);
    return { status: -1, message: '获取监考汇总失败', data: { rows: [], total: 0 } };
  }
};

// ================= 学生课表（供教师端查看） =================
export interface StudentLessonInfo {
  lesson_id: number;
  start_time: number; // 秒级时间戳
  end_time: number;   // 秒级时间戳
  teacher: string;
  subject_name: string;
  room_name: string;
  topic_name: string;
  students: string;   // 逗号分隔
  class_id: number;
  class_name: string;
}

export interface StudentScheduleData {
  student_exam: any[];
  special_day: any[];
  lessons: StudentLessonInfo[];
}

export interface StudentScheduleResponse {
  status: number;
  message: string;
  data: StudentScheduleData;
}

export const getStudentSchedule = async (studentId: number | string, weekNum: number): Promise<StudentScheduleResponse> => {
  try {
    const url = `/api/students/schedule/${studentId}/${weekNum}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    const response = await fetch(url, { method: 'GET', headers });
    const data = await response.json();
    return data as StudentScheduleResponse;
  } catch (error) {
    console.error('获取学生课表失败:', error);
    return { status: -1, message: '获取学生课表失败', data: { student_exam: [], special_day: [], lessons: [] } } as StudentScheduleResponse;
  }
};

// 学生课程时间表（按时间戳键）
export interface StudentLessonTableItem {
  room_name: string;
  room_id: number;
  lesson_id: number;
  subject_id: number;
  subject_name: string;
  start_time: number; // 秒级时间戳
  topic_id: number;
  end_time: number;   // 秒级时间戳
  teacher: string;
  week_num: number;
}

export interface StudentLessonTableResponse {
  status: number;
  message: string;
  data: Record<string, StudentLessonTableItem>;
}

// 获取学生课程时间表
export const getStudentLessonTable = async (recordId: number | string): Promise<StudentLessonTableResponse> => {
  try {
    const params = new URLSearchParams();
    params.append('record_id', String(recordId));
    const url = `/api/students/get_lesson_table?${params.toString()}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    const response = await fetch(url, { method: 'GET', headers });
    const data = await response.json();
    return data as StudentLessonTableResponse;
  } catch (error) {
    console.error('获取学生课程时间表失败:', error);
    return { status: -1, message: '获取学生课程时间表失败', data: {} } as StudentLessonTableResponse;
  }
};

// 学生姓名查询
export interface StudentNameResponse {
  status: number;
  message: string;
  data: string; // 学生姓名
}

export const getStudentName = async (studentId: number | string): Promise<StudentNameResponse> => {
  try {
    const url = `/api/students/student-name/${studentId}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    const response = await fetch(url, { method: 'GET', headers });
    const data = await response.json();
    return data as StudentNameResponse;
  } catch (error) {
    console.error('获取学生姓名失败:', error);
    return { status: -1, message: '获取学生姓名失败', data: '' } as StudentNameResponse;
  }
};

// ======== 班级课表相关接口 ========

// 班级课表数据结构
export interface ClassScheduleLesson {
  id: number;
  start_time: number;
  end_time: number;
  room_id: number;
  room_name: string;
  students: string;
  student_ids: number[];
  topic_name: string;
  subject_id: number;
}

export interface ClassScheduleSubject {
  id: number;
  class_id: number;
  teacher_id: number;
  topic_id: number;
  teacher_name: string;
  topic_name: string;
}

export interface ClassScheduleData {
  class_name: string;
  class_id: string;
  class_campus_id: number;
  class_campus_name: string;
  class_subjects: ClassScheduleSubject[];
  teacher_class: Record<string, any>;
  lessons: ClassScheduleLesson[];
  room_taken: Record<number, number[][]>;
  all_rooms: Array<{ id: number; name: string }>;
}

export interface ClassScheduleResponse {
  status: number;
  message: string;
  data: ClassScheduleData;
}

// 获取班级课表
export const getClassSchedule = async (classId: string, weekNum: string): Promise<ClassScheduleResponse> => {
  try {
    const url = `/api/class/schedule/${classId}/${weekNum}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    const response = await fetch(url, { method: 'GET', headers });
    const data = await response.json();
    return {
      status: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    } as ClassScheduleResponse;
  } catch (error) {
    console.error('获取班级课表失败:', error);
    return { status: -1, message: '获取班级课表失败', data: {} as ClassScheduleData } as ClassScheduleResponse;
  }
};

// 房间使用情况数据结构
export interface RoomUsageData {
  room_taken: Record<number, number[][]>;
  all_rooms: Array<{ id: number; name: string }>;
}

export interface RoomUsageResponse {
  status: number;
  message: string;
  data: RoomUsageData;
}

// 获取房间使用情况
export const getRoomUsage = async (weekNum: string): Promise<RoomUsageResponse> => {
  try {
    const url = `/api/class/get_room_usage/${weekNum}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    const response = await fetch(url, { method: 'GET', headers });
    const data = await response.json();
    return {
      status: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    } as RoomUsageResponse;
  } catch (error) {
    console.error('获取房间使用情况失败:', error);
    return { status: -1, message: '获取房间使用情况失败', data: {} as RoomUsageData } as RoomUsageResponse;
  }
};

// 班级课表编辑课程参数
export interface EditLessonParams {
  record_id: number;
  repeat_num: number;
  start_time: number;
  end_time: number;
  room_id: number;
}

// 编辑课程
export const editClassLesson = async (params: EditLessonParams): Promise<ApiResponse> => {
  try {
    const url = `/api/class/edit_lesson`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    const data = await response.json();
    
    // 处理特殊的错误格式
    let errorMessage = '';
    if (data.status !== 0 && data.message) {
      if (typeof data.message === 'object' && data.message.error) {
        // 处理 {message: {error: [...], teacher_flag: 0, student_flag: 0, room_flag: 1}} 格式
        errorMessage = Array.isArray(data.message.error) 
          ? data.message.error.join('; ') 
          : String(data.message.error);
      } else if (typeof data.message === 'string') {
        errorMessage = data.message;
      } else {
        errorMessage = JSON.stringify(data.message);
      }
    }
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: errorMessage || data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('编辑课程失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '编辑课程失败',
    };
  }
};

// 班级课表新增课程参数
export interface AddLessonParams {
  class_id: string;
  repeat_num: number;
  start_time: number;
  end_time: number;
  room_id: number;
  subject_id: number;
}

// 新增课程
export const addClassLesson = async (params: AddLessonParams): Promise<ApiResponse> => {
  try {
    const url = `/api/class/add_lesson`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    const data = await response.json();
    
    // 处理特殊的错误格式
    let errorMessage = '';
    if (data.status !== 0 && data.message) {
      if (typeof data.message === 'object' && data.message.error) {
        // 处理 {message: {error: [...], teacher_flag: 0, student_flag: 0, room_flag: 1}} 格式
        errorMessage = Array.isArray(data.message.error) 
          ? data.message.error.join('; ') 
          : String(data.message.error);
      } else if (typeof data.message === 'string') {
        errorMessage = data.message;
      } else {
        errorMessage = JSON.stringify(data.message);
      }
    }
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: errorMessage || data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('新增课程失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '新增课程失败',
    };
  }
};

// 班级课表删除课程参数
export interface DeleteLessonParams {
  record_id: number;
  repeat_num: number;
}

// 删除课程
export const deleteClassLesson = async (params: DeleteLessonParams): Promise<ApiResponse> => {
  try {
    const url = `/api/class/delete_lesson`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    const data = await response.json();
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('删除课程失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '删除课程失败',
    };
  }
};

// 班级信息相关接口定义
export interface ClassStudent {
  student_id: number;
  start_time: number;
  end_time: number;
}

export interface ClassTopic {
  id: number;
  teacher_id: number;
  description: string;
  topic_id: number;
  exam_id: number;
  student_signup: string;
}

export interface ExamInfo {
  id: number;
  name: string;
  time: number;
}

export interface ClassInfoData {
  student_list: Record<string, string>;
  staff_list: Record<string, string>;
  topics: Record<string, string>;
  class_topics: ClassTopic[];
  exam_list: ExamInfo[];
  class_student: ClassStudent[];
}

export interface ClassInfoResponse {
  status: number;
  message: string;
  data: ClassInfoData;
}

export const getClassInfo = async (classId: string): Promise<ClassInfoResponse> => {
  try {
    const response = await fetch(`/api/class/class-info/${classId}`, {
      method: 'GET',
      headers: {
        ...getAuthHeader(),
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      return data;
    } else {
      return { 
        status: -1, 
        message: '获取班级信息失败', 
        data: {
          student_list: {},
          staff_list: {},
          topics: {},
          class_topics: [],
          exam_list: [],
          class_student: []
        }
      };
    }
  } catch (error) {
    console.error('获取班级信息失败:', error);
    return { 
      status: -1, 
      message: '获取班级信息失败', 
      data: {
        student_list: {},
        staff_list: {},
        topics: {},
        class_topics: [],
        exam_list: [],
        class_student: []
      }
    };
  }
};

// 员工编辑相关接口定义
export interface StaffEditInfo {
  staff_info: {
    id: number;
    campus_id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    name_search_cache: string;
    phone_0: string;
    phone_1: string;
    email: string;
    email_verified: number;
    active: number;
    inactive_since: number;
    pay_model_id: number;
    zoom_id: string;
    mentor_leader_id: number;
    company_email: string;
    wework_id: string;
    genders: number;
  };
  mentor_info: Array<[number, string]>; // [mentor_id, mentor_name]
  staff_group_names: string;
  staff_group: {
    [key: string]: Array<{
      group_name: string;
      group_id: number;
    }>;
  };
  groups: {
    [key: string]: string;
  };
  campus_info: Array<[number, string]>; // [campus_id, campus_name]
}

export interface StaffEditFormData {
  campus_id: number;
  company_email: string;
  email: string;
  first_name: string;
  group_ids: string;
  last_name: string;
  mentor_leader_id: number;
  phone_0: string;
  phone_1: string;
  record_id: number;
  zoom_id: string;
}

// 获取员工编辑信息
export const getStaffEditInfo = async (staffId: number): Promise<ApiResponse<StaffEditInfo>> => {
  try {
    console.log('获取员工编辑信息请求URL:', `/api/staff/info/${staffId}`);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch(`/api/staff/info/${staffId}`, {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    console.log('获取员工编辑信息响应状态:', response.status);
    console.log('获取员工编辑信息响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取员工编辑信息失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取员工编辑信息失败',
    };
  }
};

// 更新员工信息
export const updateStaffInfo = async (staffData: StaffEditFormData): Promise<ApiResponse> => {
  try {
    console.log('更新员工信息请求参数:', staffData);
    console.log('更新员工信息请求URL:', '/api/staff/edit');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/staff/edit', {
      method: 'POST',
      headers,
      body: JSON.stringify(staffData),
    });
    
    const data = await response.json();
    console.log('更新员工信息响应状态:', response.status);
    console.log('更新员工信息响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('更新员工信息失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '更新员工信息失败',
    };
  }
};

// Campus相关接口定义
// 学生管理相关接口定义
export interface Student {
  student_id: number;
  name: string;
  grade: string;
  campus: string;
  email?: string;
  phone?: string;
  parent_phone?: string;
  status?: number; // 0-退学, 1-在读
  mentor_name?: string;
  mentor_id?: number;
  class_info?: Record<string, string>;
  disabled?: number; // 1-停用，0-启用
  created_at?: string;
  updated_at?: string;
}

export interface StudentFormData {
  first_name: string;
  last_name: string;
  gender: number; // -1: Not set, 0: Female, 1: Male
  personal_id: string;
  birthday: string;
  graduation_date: string;
  email: string;
  mentor_id: string;
  campus_id: number;
}

export interface StudentEditInfo {
  student_data: {
    id: number;
    campus_id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    name_search_cache: string;
    phone_0: string;
    phone_1: string;
    email: string;
    email_verified: number;
    active: number;
    inactive_since: number;
    grade: string;
  };
  campus_info: Array<[number, string]>; // [campus_id, campus_name]
}

export interface StudentEditFormData {
  campus_id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  parent_phone: string;
  record_id: number;
  grade: string;
}

export interface StudentInfo {
  total_info: {
    total_lesson_count: number;
    total_lesson_hours: number;
    lesson_this_week: number;
    lesson_this_month: number;
    average_rating: number;
    average_test_result: string;
    result_count: number;
  };
  student_data: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_0: string;
    phone_1: string;
    grade: string;
    campus_name: string;
    active: number;
  };
  student_name: string;
  subjects: Subject[];
  mentor_info: string[];
}

export interface Campus {
  id: number;
  name: string;
  code?: string;
}

export interface CampusListResponse {
  status: number;
  message: string;
  data: Campus[];
}

// 获取campus列表
export const getCampusList = async (): Promise<CampusListResponse> => {
  try {
    console.log('获取campus列表请求URL:', '/api/campus/list');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/campus/list', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    console.log('获取campus列表响应状态:', response.status);
    console.log('获取campus列表响应结果:', data);
    
    return {
      status: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data || [],
    };
  } catch (error) {
    console.error('获取campus列表失败:', error);
    return {
      status: 500,
      message: error instanceof Error ? error.message : '获取campus列表失败',
      data: [],
    };
  }
};

// 获取所有校区列表 (新增接口)
export const getAllCampus = async (): Promise<CampusListResponse> => {
  try {
    console.log('获取所有校区列表请求URL:', '/api/campus/get_all_campus');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/campus/get_all_campus', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    console.log('获取所有校区列表响应状态:', response.status);
    console.log('获取所有校区列表响应结果:', data);
    
    return {
      status: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data || [],
    };
  } catch (error) {
    console.error('获取所有校区列表失败:', error);
    return {
      status: 500,
      message: error instanceof Error ? error.message : '获取所有校区列表失败',
      data: [],
    };
  }
};

// 重置密码相关接口定义
export interface ResetPasswordResponse {
  status: number;
  message: string;
  data: {
    new_pass: string;
  };
}

// 重置员工密码
export const resetStaffPassword = async (staffId: number): Promise<ResetPasswordResponse> => {
  try {
    console.log('重置密码请求参数:', { staff_id: staffId });
    console.log('重置密码请求URL:', '/api/staff/reset_password');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/staff/reset_password', {
      method: 'POST',
      headers,
      body: JSON.stringify({ staff_id: staffId }),
    });
    
    const data = await response.json();
    console.log('重置密码响应状态:', response.status);
    console.log('重置密码响应结果:', data);
    
    return {
      status: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data || { new_pass: '' },
    };
  } catch (error) {
    console.error('重置密码失败:', error);
    return {
      status: 500,
      message: error instanceof Error ? error.message : '重置密码失败',
      data: { new_pass: '' },
    };
  }
};

// 员工简要信息类型定义（来自学生列表API）
export type StaffInfoTuple = [number, string]; // [staff_id, staff_name]

// 学生信息类型定义
export interface StudentInfo {
  student_id: number;
  student_name: string;
  mentor_id: number;
  mentor_name: string;
  class_info: Record<string, string>; // 课程ID -> 课程名称映射
  campus_name: string;
  disabled: number;
}

// 学生列表响应类型定义
export interface StudentListResponse {
  status: number;
  message: string;
  data: {
    staff_info: StaffInfoTuple[]; // 员工信息数组
    list_info: StudentInfo[]; // 学生信息数组
  };
}

export const getStudentList = async (searchParams?: { 
  name?: string; 
  page?: number; 
  limit?: number; 
  disabled?: 0 | 1; // 0 仅在读; 1 包含停用
}): Promise<ApiResponse> => {
  try {
    const params = new URLSearchParams();
    if (searchParams) {
      if (searchParams.name) params.append('name', searchParams.name);
      if (searchParams.page) params.append('page', searchParams.page.toString());
      if (searchParams.limit) params.append('limit', searchParams.limit.toString());
      if (searchParams.disabled !== undefined) params.append('disabled', searchParams.disabled.toString());
    }
    
    const url = `/api/students/student_list${params.toString() ? `?${params.toString()}` : ''}`;
    console.log('获取学生列表请求URL:', url);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    console.log('获取学生列表响应状态:', response.status);
    console.log('获取学生列表响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取学生列表异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取学生列表失败',
    };
  }
};

export const getActiveStudentList = async (searchParams?: { 
  name?: string; 
  page?: number; 
  limit?: number; 
}): Promise<ApiResponse> => {
  return getStudentList({ ...searchParams, disabled: 0 });
};

export const getDisabledStudentList = async (searchParams?: { 
  name?: string; 
  page?: number; 
  limit?: number; 
}): Promise<ApiResponse> => {
  return getStudentList({ ...searchParams, disabled: 1 });
};

export const getAllStudentList = async (searchParams?: { 
  name?: string; 
  page?: number; 
  limit?: number; 
}): Promise<ApiResponse> => {
  // 后端 disabled=1 表示包含停用账户
  return getStudentList({ ...searchParams, disabled: 1 });
};

export const addStudent = async (studentData: StudentFormData): Promise<ApiResponse> => {
  try {
    console.log('添加学生请求参数:', studentData);
    console.log('添加学生请求URL:', '/api/students/add');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/students/add', {
      method: 'POST',
      headers,
      body: JSON.stringify(studentData),
    });
    
    const data = await response.json();
    console.log('添加学生响应状态:', response.status);
    console.log('添加学生响应结果:', data);
    
    if (response.ok) {
      return {
        code: 200,
        message: data.message || '学生添加成功',
        data: data.data, // 这里应该包含生成的密码
      };
    } else {
      return {
        code: response.status,
        message: data.message || '添加学生失败',
        data: data.data,
      };
    }
  } catch (error) {
    console.error('添加学生异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '添加学生失败',
    };
  }
};

export const editStudent = async (studentId: number, studentData: StudentFormData): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/students/${studentId}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(studentData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('编辑学生失败:', error);
    throw error;
  }
};

export const deleteStudent = async (recordId: number): Promise<ApiResponse> => {
  try {
    console.log('删除学生请求参数:', { record_id: recordId });
    console.log('删除学生请求URL:', '/api/students/delete');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/students/delete', {
      method: 'POST',
      headers,
      body: JSON.stringify({ record_id: recordId }),
    });
    
    const data = await response.json();
    console.log('删除学生响应状态:', response.status);
    console.log('删除学生响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('删除学生异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '删除学生失败',
    };
  }
};

export const updateStudentActiveStatus = async (recordId: number, status: 0 | 1): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    const response = await fetch('/api/students/update_student_status', {
      method: 'POST',
      headers,
      body: JSON.stringify({ record_id: recordId, status }),
    });

    const data = await response.json();
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('更新学生状态失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '更新学生状态失败',
    };
  }
};

export const disableStudentAccount = async (studentId: number): Promise<ApiResponse> => {
  return updateStudentActiveStatus(studentId, 0);
};

export const enableStudentAccount = async (studentId: number): Promise<ApiResponse> => {
  return updateStudentActiveStatus(studentId, 1);
};

// 学生编辑相关API函数
export const getStudentEditInfo = async (studentId: number): Promise<ApiResponse<StudentEditInfo>> => {
  try {
    const response = await fetch(`/api/students/get_edit_info/${studentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });
    const data = await response.json();
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取学生编辑信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取学生编辑信息失败' };
  }
};

export const updateStudentInfo = async (studentData: StudentEditFormData): Promise<ApiResponse> => {
  try {
    const response = await fetch('/api/students/update_student_info/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(studentData as any),
    });
    const data = await response.json();
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('更新学生信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '更新学生信息失败' };
  }
};

// 学生信息更新（根据最新Swagger定义）
export interface StudentUpdatePayload {
  active: string;
  address: string;
  assigned_staff: number;
  birthday: number;
  campus_id: number;
  cie_flag: number;
  current_grade: string;
  current_school: string;
  day_student: number;
  email: string;
  english_name: string;
  enrolment_date: number;
  exam_0_number: string;
  exam_1_number: string;
  exam_2_number: string;
  fathers_email: string;
  fathers_employer: string;
  fathers_name: string;
  fathers_occupation: string;
  fathers_phone_number: string;
  first_name: string;
  gender: number;
  grade: number;
  graduation_date: number;
  hometown: string;
  last_name: string;
  mentor_id: number;
  mothers_email: string;
  mothers_employer: string;
  mothers_name: string;
  mothers_occupation: string;
  mothers_phone_number: string;
  nationality: string;
  personal_id: string;
  personal_statement: string;
  phone_number: string;
  pinyin_first_name: string;
  pinyin_last_name: string;
  record_id: number;
  sales_pay_date: number;
  special_note: string;
  year_fee: string;
  year_fee_repayment_time_1: number;
  year_fee_repayment_time_2: number;
  year_fee_repayment_time_3: number;
}

export const updateStudentInfoV2 = async (
  payload: StudentUpdatePayload
): Promise<ApiResponse> => {
  try {
    const response = await fetch('/api/students/update_student_info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('更新学生信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '更新学生信息失败' };
  }
};

// 重置学生密码
export const resetStudentPassword = async (recordId: number): Promise<ApiResponse<{ new_pass?: string }>> => {
  try {
    const response = await fetch('/api/students/reset_password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ record_id: recordId }),
    });
    const data = await response.json();
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('重置学生密码失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '重置学生密码失败' } as ApiResponse<{
      new_pass?: string;
    }>;
  }
};

// 重置学生学号（长学号）
export const resetStudentId = async (recordId: number): Promise<ApiResponse> => {
  try {
    const response = await fetch('/api/students/reset_student_id', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ record_id: recordId }),
    });
    const data = await response.json();
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('重置学生学号失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '重置学生学号失败' };
  }
};

// 更新学生考试成绩
export interface UpdateExamResultParams {
  record_id: number;
  result: number;
  student_id: number;
}

export const updateStudentExamResult = async (
  params: UpdateExamResultParams
): Promise<ApiResponse> => {
  try {
    const response = await fetch('/api/students/update_exam_result', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(params),
    });
    const data = await response.json();
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('更新学生成绩失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '更新学生成绩失败' };
  }
};
// 获取学生详细信息
export const getStudentInfo = async (studentId: string): Promise<ApiResponse<StudentInfo>> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/students/${studentId}/info`, {
      method: 'GET',
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('获取学生信息失败:', error);
    throw error;
  }
};

// ============== 学生视图（all_lessons） ==============
export interface StudentViewLessonItem {
  start_time: number;
  end_time: number;
}

export interface StudentViewSubject {
  teacher_id: number;
  topic_id: number;
  topic_name: string;
  lessons: StudentViewLessonItem[];
}

export interface StudentViewClassEntry {
  class_name: string;
  student_num: number;
  subjects: Record<string, StudentViewSubject>;
}

export interface StudentViewResponseData {
  lesson_data: Record<string, StudentViewClassEntry>;
  student_data: {
    first_name: string;
    last_name: string;
    enrolment_date: string | number | null;
    graduation_date: string | number | null;
    year_fee: number | null;
    gender: number | null;
    email: string | null;
    active: number;
  } | null;
  student_class: Record<string, { start_time: number; end_time: number }>;
  class_topics: Record<string, string>;
  feedback: any[];
  dormitory_data: any[];
  absence_info: any;
}

export interface StudentViewResponse {
  status: number;
  message: string;
  data: StudentViewResponseData;
}

export const getStudentAllLessonsView = async (studentId: number | string): Promise<StudentViewResponse> => {
  try {
    const url = `/api/students/student-view/all_lessons/${studentId}`;
    console.log('获取学生视图请求URL:', url);
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    const response = await fetch(url, { method: 'GET', headers });
    const data = await response.json();
    console.log('获取学生视图响应状态:', response.status);
    console.log('获取学生视图响应结果:', data);
    return data as StudentViewResponse;
  } catch (error) {
    console.error('获取学生视图失败:', error);
    return { status: -1, message: '获取学生视图失败', data: { lesson_data: {}, student_data: null, student_class: {}, class_topics: {}, feedback: [], dormitory_data: [], absence_info: null } } as StudentViewResponse;
  }
};

// Classes 相关接口
export interface ClassItem {
  id: number;
  name: string;
  active: number;
  credit_based: number;
  attendance_handling: number;
  student_num: number;
  subject_num: number;
  student_self_signup: number;
  non_attendance_free: number;
  campus_id: number;
  campus_name: string;
  lesson: string; // 格式: "已完成/总计" 如 "5/10"
  settings: string; // 逗号分隔的设置列表
}

export interface ClassListParams {
  page: number;
  page_size: number;
  search?: string;
  show_disable?: number;
}

export interface ClassListResponse {
  status: number;
  message: string;
  data: {
    list: ClassItem[];
    total: number;
  };
}

export interface AddClassParams {
  name: string;
  description?: string;
  teacher_id?: number;
  campus_id?: number;
  start_date?: string;
  end_date?: string;
}

// 根据后端接口调整的新增班级参数
export interface NewClassParams {
  class_name: string;
  campus_id: number;
  students: string; // 逗号分隔的学生ID字符串
}

// 添加班级时的学生信息接口
export interface AddClassStudentInfo {
  id: number;
  name: string;
  student_id: number;
}

// 获取添加班级选择数据的响应
export interface AddClassSelectData {
  student_info: AddClassStudentInfo[];
  campus_info: Campus[];
}

// 获取班级列表
export const getClassList = async (params: ClassListParams): Promise<ClassListResponse> => {
  try {
    const searchParams = new URLSearchParams();
    searchParams.append('page', params.page.toString()); // 后端期望从1开始
    searchParams.append('page_size', params.page_size.toString());
    if (params.search) {
      searchParams.append('search', params.search);
    }
    if (params.show_disable !== undefined) {
      searchParams.append('show_disable', params.show_disable.toString());
    }

    const response = await fetch(`/api/class/list?${searchParams.toString()}`, {
      method: 'GET',
      headers: getAuthHeader(),
    });
    const data = await response.json();
    return {
      status: data.status === 0 ? 200 : data.status,
      message: data.message || '',
      data: data.data || { list: [], total: 0 },
    };
  } catch (error) {
    console.error('获取班级列表失败:', error);
    return { 
      status: 500, 
      message: '获取班级列表失败', 
      data: { list: [], total: 0 }
    };
  }
};

// 获取添加班级所需的选择数据
export const getAddClassSelectData = async (): Promise<{
  code: number;
  message: string;
  data?: AddClassSelectData;
}> => {
  try {
    console.log('获取添加班级选择数据');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/class/get_add_select', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    console.log('获取添加班级选择数据原始响应:', data);
    
    // 适配器：将对象格式转换为数组格式
    let adaptedData: AddClassSelectData | undefined;
    
    if (data.data) {
      // 转换学生信息：从对象 {id: name} 转为数组 [{id, name, student_id}]
      // 适配新版 student_info: [[id, name], ...] 的格式
      const studentInfo: AddClassStudentInfo[] = [];
      if (Array.isArray(data.data.student_info)) {
        data.data.student_info.forEach((item: [number | string, string]) => {
          const [id, name] = item;
          studentInfo.push({
            id: Number(id),
            name: name,
            student_id: Number(id),
          });
        });
      }

      // 校区信息依然适配对象格式
      const campusInfo: Campus[] = [];
      if (data.data.campus_info && typeof data.data.campus_info === 'object') {
        data.data.campus_info.forEach((item: [number | string, string]) => {
          const [id, name] = item;
          campusInfo.push({
            id: Number(id),
            name: name as string,
            code: '', // 如果没有code字段，设为空字符串
          });
        });
      }
      console.log(campusInfo, studentInfo)
      
      adaptedData = {
        student_info: studentInfo,
        campus_info: campusInfo,
      };
      
      console.log('转换后的数据:', adaptedData);
    }
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: adaptedData,
    };
  } catch (error) {
    console.error('获取添加班级选择数据异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取数据失败',
    };
  }
};

// 添加新班级（使用新的接口格式）
export const addNewClass = async (params: NewClassParams): Promise<ApiResponse> => {
  try {
    console.log('添加新班级请求参数:', params);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/class/add', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    console.log('添加新班级响应:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('添加新班级异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '添加班级失败',
    };
  }
};

// 添加新班级（旧版本，保持兼容性）
export const addClass = async (params: AddClassParams): Promise<ApiResponse> => {
  try {
    const response = await fetch('/api/class/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(params),
    });
    const data = await response.json();
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('添加班级失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '添加班级失败' };
  }
};

// Class view 相关接口和类型定义
export interface ClassSubject {
  id: number;
  topic_id: number;
  topic_name: string;
  class_name: string;
  teacher_name: string;
  exam_name: string | null;
  description: string;
  student_exam: string[];
}

export interface StudentClass {
  id: number;
  student_id: number;
  name: string;
  start_time: number;
  end_time: number;
  credit: number;
}

export interface SubjectLesson {
  id: number;
  subject_id: number;
  start_time: number;
  end_time: number;
  room_id: number;
  room_name: string;
}

export interface ClassViewData {
  subjects: ClassSubject[];
  students_classes: Record<string, StudentClass>;
  subject_lesson: Record<string, SubjectLesson[]>;
}

// 获取class详情
export const getClassView = async (classId: number): Promise<{
  code: number;
  message: string;
  data?: ClassViewData;
}> => {
  try {
    console.log('获取class详情，ID:', classId);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch(`/api/class/class-view/${classId}`, {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    console.log('获取class详情响应:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取class详情异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取class详情失败',
    };
  }
};

// Edit class 相关接口和类型定义
export interface ClassInfo {
  name: string;
  active: number;
  credit_based: number;
  campus_id: number;
  attendance_handling: number;
  student_self_signup: number;
  non_attendance_free: number;
  double_time: number;
}

export interface ClassSubjectEdit {
  id: number;
  topic_id: number;
  teacher_id: number;
  student_signup: number;
  non_counted: number;
  description: string;
  active: number;
  exam_id: number;
}

export interface ClassStudentEdit {
  student_id: number;
  start_time: number;
  end_time: number;
}

export interface ExamInfo {
  id: number;
  name: string;
  time: number;
}

export interface Topic {
  id: number;
  name: string;
}

export interface ClassStaffInfo {
  id: number;
  name: string;
}

export interface ClassStudentInfo {
  id: number;
  name: string;
}

export interface ClassEditData {
  class_info: ClassInfo;
  class_subject: ClassSubjectEdit[];
  campus_info: Campus[];
  staff_info: ClassStaffInfo[];
  student_info: ClassStudentInfo[];
  topics: Topic[];
  class_student: ClassStudentEdit[];
  exam_info: ExamInfo[];
}

// 获取class编辑信息
export const getClassEditInfo = async (classId: number): Promise<{
  code: number;
  message: string;
  data?: ClassEditData;
}> => {
  try {
    console.log('获取class编辑信息，ID:', classId);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch(`/api/class/get_edit_info/${classId}`, {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    console.log('获取class编辑信息响应:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取class编辑信息异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取class编辑信息失败',
    };
  }
};

// 编辑class参数
export interface EditClassParams {
  record_id: number;
  campus_id: number;
  class_name: string;
  double_time: number;
  students: Array<{
    student_id: number;
    start_time: number;
    end_time: number;
  }>;
  subjects: Array<{
    topic_id: number;
    teacher_id: number;
    description: string;
    student_signup: number;
    exam_id: number;
  }>;
}

// 编辑class
export const editClass = async (params: EditClassParams): Promise<ApiResponse> => {
  try {
    console.log('编辑class请求参数:', params);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/class/edit', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    console.log('编辑class响应:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('编辑class异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '编辑class失败',
    };
  }
};

// Add to group参数
export interface AddToGroupParams {
  record_id: number;
  week_lessons: number;
  assign_name: string;
}

// Add to group
export const addToGroup = async (params: AddToGroupParams): Promise<ApiResponse> => {
  try {
    console.log('Add to group请求参数:', params);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/class/add_to_group', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    console.log('Add to group响应:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('Add to group异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : 'Add to group失败',
    };
  }
};

// 更新班级状态 (启用/禁用)
export interface UpdateClassStatusParams {
  record_id: number;
  status: number; // 1: 启用, 0: 禁用
}

export const updateClassStatus = async (params: UpdateClassStatusParams): Promise<ApiResponse> => {
  try {
    console.log('更新班级状态请求参数:', params);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/class/update_status', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    console.log('更新班级状态响应:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('更新班级状态异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '更新班级状态失败',
    };
  }
};

// 删除班级
export interface DeleteClassParams {
  record_id: number;
}

export const deleteClass = async (params: DeleteClassParams): Promise<ApiResponse> => {
  try {
    console.log('删除班级请求参数:', params);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/class/delete', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    console.log('删除班级响应:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('删除班级异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '删除班级失败',
    };
  }
};

// Exam management APIs

export interface ExamListItem {
  id: number;
  name: string;
  code: string;
  type?: number | string;
  topic?: string;
  period?: number;
  time?: number | string;
  location?: string;
  price?: number;
  price_string?: string;
}

// 首次费用报名记录接口定义
export interface FirstFeeRecord {
  student_id: number;
  name: string;
  signup_time: number;
}

// 完整的考试列表响应接口定义
export interface ExamListResponse {
  status: number;
  message: string;
  data: {
    active: ExamListItem[];
    disabled: ExamListItem[];
    inner_first_fee: FirstFeeRecord[];
    outside_first_fee: FirstFeeRecord[];
    can_download: number;
  };
}

export const getExamList = async (): Promise<ExamListResponse> => {
  try {
    const response = await fetch('/api/exam/get_exam_list', {
      method: 'GET',
      headers: getAuthHeader(),
    });
    const data = await response.json();
    return {
      status: data.status === 0 ? 200 : data.status,
      message: data.message || '',
      data: data.data || {
        active: [],
        disabled: [],
        inner_first_fee: [],
        outside_first_fee: [],
        can_download: 0
      },
    };
  } catch (error) {
    console.error('获取考试列表失败:', error);
    return {
      status: 500,
      message: '获取考试列表失败',
      data: {
        active: [],
        disabled: [],
        inner_first_fee: [],
        outside_first_fee: [],
        can_download: 0
      },
    };
  }
};

export interface AddExamParams {
  exam_name: string;
  exam_location: string;
  exam_topic: string;
  exam_code: string;
}

export const addNewExam = async (params: AddExamParams): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    const response = await fetch('/api/exam/add_new_exam', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    const data = await response.json();
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('添加考试失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '添加考试失败',
    };
  }
};

export interface UpdateExamStatusParams {
  record_id: number;
  status: number; // 0 disable, 1 enable
}

export const updateExamStatus = async (
  params: UpdateExamStatusParams
): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    const response = await fetch('/api/exam/update_exam_status', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    const data = await response.json();
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('更新考试状态失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '更新考试状态失败',
    };
  }
};

export interface DeleteExamParams {
  record_id: number;
}

export const deleteExam = async (
  params: DeleteExamParams
): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    const response = await fetch('/api/exam/delete_exam', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    const data = await response.json();
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('删除考试失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '删除考试失败',
    };
  }
};

export const getExamEditInfo = async (
  id: number
): Promise<{ code: number; message: string; data?: any }> => {
  try {
    const response = await fetch(`/api/exam/get_exam_edit_info/${id}`, {
      method: 'GET',
      headers: getAuthHeader(),
    });
    const data = await response.json();
    return {
      code: data.status === 0 ? 200 : data.status,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取考试信息失败:', error);
    return { code: 500, message: '获取考试信息失败' };
  }
};

export interface EditExamParams {
  record_id: number;
  exam_name: string;
  base_price: number;
  exam_location: string;
  exam_topic: string;
  exam_topic_id: number;
  exam_code: string;
  period: number;
  exam_type: number;
  exam_time: number;
  exam_time_2: number;
  exam_time_3: number;
}

export const editExam = async (params: EditExamParams): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    const response = await fetch('/api/exam/edit_exam', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    const data = await response.json();
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('编辑考试失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '编辑考试失败',
    };
  }
};

export interface ChangePriceParams {
  record_id?: number;
  exam_id?: number;
  change_price: number;
  change_time: number;
}

export const addChangePrice = async (
  params: Omit<ChangePriceParams, 'record_id'> & { exam_id: number }
): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    const response = await fetch('/api/exam/add_change_price', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    const data = await response.json();
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('添加价格变更失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '添加价格变更失败',
    };
  }
};

export const updateChangePrice = async (
  params: ChangePriceParams & { record_id: number }
): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    const response = await fetch('/api/exam/update_change_price', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    const data = await response.json();
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('更新价格变更失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '更新价格变更失败',
    };
  }
};

export const deleteChangePrice = async (
  params: { record_id: number }
): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    const response = await fetch('/api/exam/delete_change_price', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    const data = await response.json();
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('删除价格变更失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '删除价格变更失败',
    };
  }
};

// ================= 教室管理相关接口 =================

// 教室信息接口定义
export interface Classroom {
  id: number;
  name: string;
  campus_id: number;
  campus_name: string;
  size: number;
  flag: number;
  owner: number;
  owner_name: string;
}

// 教室列表响应接口
export interface ClassroomListResponse {
  status: number;
  message: string;
  data: {
    room_list: Classroom[];
    campus_info: Array<{ id: number; name: string }>;
    staff_info: Record<string, string>;
  };
}

// 新增教室参数接口
export interface AddClassroomParams {
  room_name: string;
  campus_id: number;
  size: number;
  flag: number;
  owner: number;
}

// 更新教室参数接口
export interface UpdateClassroomParams {
  room_id: number;
  room_name: string;
  campus_id: number;
  size: number;
  flag: number;
  owner: number;
}

// 删除教室参数接口
export interface DeleteClassroomParams {
  record_id: number;
}

// 获取教室列表
export const getClassroomList = async (): Promise<ClassroomListResponse> => {
  try {
    console.log('获取教室列表请求URL:', '/api/room/list/');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/room/list/', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    console.log('获取教室列表响应状态:', response.status);
    console.log('获取教室列表响应结果:', data);
    
    return {
      status: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data || { room_list: [], campus_info: [], staff_info: {} },
    };
  } catch (error) {
    console.error('获取教室列表失败:', error);
    return {
      status: 500,
      message: error instanceof Error ? error.message : '获取教室列表失败',
      data: { room_list: [], campus_info: [], staff_info: {} },
    };
  }
};

// 新增教室
export const addClassroom = async (params: AddClassroomParams): Promise<ApiResponse> => {
  try {
    console.log('新增教室请求参数:', params);
    console.log('新增教室请求URL:', '/api/room/add/');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    // 注意：后端可能没有专门的add接口，这里先假设存在
    // 如果后端没有add接口，需要联系后端开发人员添加相应的API
    const response = await fetch('/api/room/add/', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    console.log('新增教室响应状态:', response.status);
    console.log('新增教室响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('新增教室失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '新增教室失败',
    };
  }
};

// 更新教室信息
export const updateClassroom = async (params: UpdateClassroomParams): Promise<ApiResponse> => {
  try {
    console.log('更新教室请求参数:', params);
    console.log('更新教室请求URL:', '/api/room/update/');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/room/update/', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    console.log('更新教室响应状态:', response.status);
    console.log('更新教室响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('更新教室失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '更新教室失败',
    };
  }
};

// 删除教室
export const deleteClassroom = async (params: DeleteClassroomParams): Promise<ApiResponse> => {
  try {
    console.log('删除教室请求参数:', params);
    console.log('删除教室请求URL:', '/api/room/delete/');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/room/delete/', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    console.log('删除教室响应状态:', response.status);
    console.log('删除教室响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('删除教室失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '删除教室失败',
    };
  }
};

// ================= 教室课表相关接口 =================

// 教室课表课程信息接口
export interface ClassroomLessonInfo {
  subject_id: number;
  start_time: number;
  end_time: number;
  id: number;
  room_id: number;
  subject_info: {
    teacher_id: number;
    teacher_name: string;
    class_id: number;
    topic_id: number;
    topic_name: string;
  };
  student_ids: number[];
  student_names: string[];
  class_name: string;
  room_name: string;
}

// 教室课表响应接口
export interface ClassroomScheduleResponse {
  status: number;
  message: string;
  data: ClassroomLessonInfo[];
}

// 获取指定周的教室课表
export const getClassroomSchedule = async (roomId: string, weekNum: string): Promise<ClassroomScheduleResponse> => {
  try {
    console.log('获取教室课表请求URL:', `/api/room/schedule/${roomId}/${weekNum}/`);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch(`/api/room/schedule/${roomId}/${weekNum}/`, {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    console.log('获取教室课表响应状态:', response.status);
    console.log('获取教室课表响应结果:', data);
    
    return {
      status: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data || [],
    };
  } catch (error) {
    console.error('获取教室课表失败:', error);
    return {
      status: 500,
      message: error instanceof Error ? error.message : '获取教室课表失败',
      data: [],
    };
  }
};

export const deleteInnerSignup = async (
  params: { record_id: number }
): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    const response = await fetch('/api/exam/delete_inner_signup', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    const data = await response.json();
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('删除内部报名失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '删除内部报名失败',
    };
  }
};

export const deletePublicSignup = async (
  params: { record_id: number }
): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    const response = await fetch('/api/exam/delete_public_signup', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    const data = await response.json();
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('删除公共报名失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '删除公共报名失败',
    };
  }
};

// ==================== Service 宿舍管理相关接口 ====================

// Service 宿舍信息接口
export interface ServiceItem {
  id: number;
  name: string;
  gender: number;
  size: number;
  booked: number;
  campus: number;
  mentor_id?: number;
  locked: number;
  grade?: string;
  graduate_year: number;
  mentor_name?: string;
  campus_name?: string;
  toilets?: number;
  price?: number;
  start_time?: number;
  end_time?: number;
  dormitory_type?: number;
}

// Service 列表响应接口
export interface ServiceListResponse {
  code: number;
  message: string;
  data: {
    all_list: ServiceItem[];
    dormitory_student: Record<number, string[]>;
    campus_dict: Array<{ id: number; name: string }>;
    staff_dict: Array<{ id: number; name: string }>;
  };
}

// 添加 Service 参数接口
export interface AddServiceParams {
  name: string;
  gender: number;
  size: number;
  price: number;
  campus: number;
  mentor_id?: number;
  is_dormitory: number;
}

// 编辑 Service 参数接口
export interface EditServiceParams {
  record_id: number;
  name: string;
  gender: number;
  toilets: number;
  size: number;
  price: number;
  start_time: number;
  end_time: number;
  booked: number;
  campus: number;
  mentor_id?: number;
  locked: number;
  graduate_year: number;
}

// 删除 Service 参数接口
export interface DeleteServiceParams {
  record_id: number;
}

// Service 编辑信息响应接口
export interface ServiceEditInfoResponse {
  code: number;
  message: string;
  data: {
    service_info: ServiceItem;
    booked_info: any[];
    campus_list: Array<{ id: number; name: string }>;
    staff_list: Array<{ id: number; name: string }>;
    student_list: Array<{ id: number; name: string }>;
    all_dormitory: Array<{ id: number; name: string }>;
  };
}

// 获取 Service 列表
export const getServiceList = async (): Promise<ServiceListResponse> => {
  try {
    const response = await fetch('/api/service/get_all', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('获取Service列表响应:', data);

    return {
      code: data.code || 0,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取Service列表失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取Service列表失败',
      data: { all_list: [], dormitory_student: {}, campus_dict: [], staff_dict: [] },
    };
  }
};

// 添加 Service
export const addService = async (params: AddServiceParams): Promise<ApiResponse> => {
  try {
    const response = await fetch('/api/service/add_service', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('添加Service响应:', data);

    return {
      code: data.code || 0,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('添加Service失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '添加Service失败',
    };
  }
};

// 编辑 Service
export const editService = async (params: EditServiceParams): Promise<ApiResponse> => {
  try {
    const response = await fetch('/api/service/edit_service', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('编辑Service响应:', data);

    return {
      code: data.code || 0,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('编辑Service失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '编辑Service失败',
    };
  }
};

// 删除 Service
export const deleteService = async (params: DeleteServiceParams): Promise<ApiResponse> => {
  try {
    const response = await fetch('/api/service/delete_service', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('删除Service响应:', data);

    return {
      code: data.code || 0,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('删除Service失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '删除Service失败',
    };
  }
};

// 获取 Service 编辑信息
export const getServiceEditInfo = async (serviceId: string): Promise<ServiceEditInfoResponse> => {
  try {
    const response = await fetch(`/api/service/get_edit_info/${serviceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('获取Service编辑信息响应:', data);

    return {
      code: data.code || 0,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取Service编辑信息失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取Service编辑信息失败',
      data: {
        service_info: {} as ServiceItem,
        booked_info: [],
        campus_list: [],
        staff_list: [],
        student_list: [],
        all_dormitory: [],
      },
    };
  }
};

