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
          window.location.href = '/staff/my-profile';
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

// 新增课程参数
export interface AddLessonParams {
  subject_id: string;
  start_time: number; // 时间戳
  end_time: number;   // 时间戳
  room_id: string;
  repeat_num?: number; // 重复次数，默认1
}

// 编辑课程参数
export interface EditLessonParams {
  lesson_id: string;
  subject_id: string;
  start_time: number; // 时间戳
  end_time: number;   // 时间戳
  room_id: string;
  repeat_num?: number; // 重复次数
}

// 删除课程参数
export interface DeleteLessonParams {
  lesson_ids: string[];
  repeat_num?: number; // 删除周数
}

// 新增课程
export async function addStaffLesson(staffId: string, params: AddLessonParams) {
  return updateStaffSchedule(staffId, {
    event_type: 2,
    add_lesson: 1,
    ...params
  } as any);
}

// 编辑课程
export async function editStaffLesson(staffId: string, params: EditLessonParams) {
  return updateStaffSchedule(staffId, {
    event_type: 2,
    change_lesson: 1,
    ...params
  } as any);
}

// 删除课程
export async function deleteStaffLesson(staffId: string, params: DeleteLessonParams) {
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