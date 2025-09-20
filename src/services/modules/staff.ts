/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthHeader } from '../apiClient';
import type { ApiResponse } from '../types';

// =============员工管理相关API函数=============

export interface Staff {
  staff_id: number;
  name: string;
  group_name: string;
  campus: string;
  email?: string;
  phone?: string;
  position?: string;
  status?: number;
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
  availability_type: number;
  schedule_data: any[];
}

export interface TeacherSchedule {
  staff_id: number;
  week_num: number;
  schedule_data: any[];
}

export interface FinanceStudentsParams {
  start_day?: string;
  end_day?: string;
  campus?: number;
}

export interface FinanceStudentData {
  student_id: number;
  student_name: string;
  enrolment_date: string;
  graduation_date: string;
  campus_name: string;
  total_hours: number;
  class_hours: number;
  attendance_hours: number;
  year_fee: number;
  stop_reason: string;
}

export interface DisabledStudentData {
  student_name: string;
  active: string;
  inactive_since: string;
  enrolment_date: string;
  graduation_date: string;
  campus_id: number;
  campus_name: string;
  stop_reason: string;
}

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
  mentor_info: Array<[number, string]>;
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
  campus_info: Array<[number, string]>;
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
