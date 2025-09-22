/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthHeader } from '../apiClient';
import type { Campus, ClassExamInfo } from './academics';
import type { ApiResponse } from '../types';

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

export interface FeedBackEntry {
  id: number;
  note: string;
  student_attendance: number;
  student_behaviour: number;
  student_homework_completion: number;
  subject_id: number;
  teacher: string;
  time_interval_id: number;
  time_range_end: string;
  time_range_start: string;
  topic_name: string;
}

export interface BiweeklyFeedbackEntry extends FeedBackEntry {
  timestamp: number;
}

const TWENTY_FOUR_HOURS_IN_MS = 24 * 60 * 60 * 1000;

const parseDateValueToMs = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') {
    if (value > 1e12) return value;
    if (value > 1e9) return value * 1000;
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  const numeric = Number(trimmed);
  if (!Number.isNaN(numeric)) {
    if (numeric > 1e12) return numeric;
    if (numeric > 1e9) return numeric * 1000;
  }
  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) return parsed;
  const fallback = Date.parse(trimmed.replace(/-/g, '/'));
  if (!Number.isNaN(fallback)) return fallback;
  return null;
};

const getFeedbackTimestamp = (entry: FeedBackEntry): number | null =>
  parseDateValueToMs((entry as any)?.updated_at) ??
  parseDateValueToMs(entry.time_range_end) ??
  parseDateValueToMs(entry.time_range_start) ??
  parseDateValueToMs((entry as any)?.created_at);

export const getBiweeklyFeedbackEntries = (
  feedback: FeedBackEntry[] | null | undefined,
  options: { now?: number; days?: number } = {}
): BiweeklyFeedbackEntry[] => {
  if (!Array.isArray(feedback) || feedback.length === 0) return [];
  const { now = Date.now(), days = 30 } = options;
  const cutoff = now - days * TWENTY_FOUR_HOURS_IN_MS;
  return feedback
    .map(item => {
      const timestamp = getFeedbackTimestamp(item);
      if (!timestamp) return null;
      return { ...item, timestamp } as BiweeklyFeedbackEntry;
    })
    .filter((item): item is BiweeklyFeedbackEntry => !!item && item.timestamp >= cutoff)
    .sort((a, b) => b.timestamp - a.timestamp);
};

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
  feedback: FeedBackEntry[];
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
  exam_info: ClassExamInfo[];
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
