/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthHeader } from '../apiClient';
import type { ApiResponse } from '../types';
import type { Subject } from '../auth';

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

export interface ClassExamInfo {
  id: number;
  name: string;
  time: number;
}

export interface ClassInfoData {
  student_list: Record<string, string>;
  staff_list: Record<string, string>;
  topics: Record<string, string>;
  class_topics: ClassTopic[];
  exam_list: ClassExamInfo[];
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
