import { request, normalizeApiResponse } from '../apiClient';
import type { ApiResponse, ApiEnvelope } from '../types';

// 学生选课申请记录类型定义
export interface GroupAssignmentRequest {
  id: number;
  student_id: number;
  signup_time: number;
  exam_id: number;
  note: string;
  self_signup_id: number;
  // 扩展字段（从后端获取）
  campus_id?: number;
  first_name?: string;
  last_name?: string;
  exam_name?: string;
  class_name?: string;
  topic_id?: number;
  mentor_id?: number;
  mentor_name?: string;
  topic_name?: string;
  campus_name?: string;
}

// 后端直接返回数组格式（实际使用）
export type GroupAssignmentListResponse = GroupAssignmentRequest[];

// 删除请求参数
export interface DeleteRequestsRequest {
  record_ids: string; // 逗号分隔的ID字符串，如 "1,2,3"
}

// 获取学生选课申请列表
export const getGroupAssignmentList = async (
  campusId?: string,
  topicId?: string
): Promise<ApiResponse<GroupAssignmentRequest[]>> => {
  try {
    const params = new URLSearchParams();
    if (campusId) params.append('campus_id', campusId);
    if (topicId) params.append('topic_id', topicId);

    const queryString = params.toString();
    const url = `/api/groups/group_assign_list${queryString ? `?${queryString}` : ''}`;

    const { data } = await request(url, {
      method: 'GET',
    });

    // 后端直接返回数组格式：{ status: 0, message: "", data: [...] }
    // 直接使用normalizeApiResponse处理，data字段就是数组
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('获取学生选课申请列表失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取学生选课申请列表失败' };
  }
};

// 删除指定的选课申请记录
export const deleteGroupAssignmentRequests = async (
  recordIds: string
): Promise<ApiResponse> => {
  try {
    const { data } = await request('/api/groups/delete_assign_group', {
      method: 'POST',
      body: { record_ids: recordIds },
    });

    return normalizeApiResponse(data as ApiEnvelope);
  } catch (error) {
    console.error('删除选课申请记录失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '删除选课申请记录失败' };
  }
};

// 清除所有选课申请记录
export const clearAllRequests = async (): Promise<ApiResponse> => {
  try {
    const { data } = await request('/api/groups/clear_all_request', {
      method: 'POST',
    });

    return normalizeApiResponse(data as ApiEnvelope);
  } catch (error) {
    console.error('清除所有选课申请记录失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '清除所有选课申请记录失败' };
  }
};

// ==================== AI排课相关接口 ====================

// 排课设置配置类型 (对应 schedule_settings 表)
export interface ScheduleSettings {
  id: number;
  start: string; // 时间戳字符串（秒值）
  weeks: number;
  prefix?: string; // 班级名称前缀
}

// Group类型定义 (对应 schedule_groups 表)
export interface Group {
  id?: number;
  topic_id: number;
  topic_name?: string;
  max_students: number;
  prefer_students: number;
  week_lessons: number;
  exam_id?: number;
  exam_name?: string;
  class_type?: string;
  fix_time?: number | number[] | string;
  fix_room?: number;
  double_lesson?: number;
  campus_id: number;
  create_time?: string | number;
  update_time?: string | number;
  assign_name?: string;
  assigning_name?: string;
  teacher?: string; // 教师ID列表
  students?: string; // 学生ID列表
}

// Group列表响应类型
export interface GroupListResponse {
  group_info: Group[];
  teacher_info: Record<number, string>; // 教师ID => 姓名
  student_info: Record<number, string>; // 学生ID => 姓名
  timeslots: string[];
  campus_info: Record<number, string>; // 校区ID => 名称
}

// Busy信息类型
export interface BusyInfo {
  id: number;
  student_id?: number;
  teacher_id?: number;
  time_id: number;
  campus_id?: number;
}

// Busy信息响应类型
export interface BusyInfoResponse {
  student_busy: BusyInfo[];
  teacher_busy: BusyInfo[];
}

// 排课结果类型
export interface ScheduleResult {
  result: {
    teacher_info: Array<{ id: number; name: string }>;
    student_info: Array<{ id: number; name: string }>;
    campus_info: Array<{ id: number; name: string }>;
    schedule_classes_data: any[];
    schedule_class_students_data: any[];
    schedule_lessons_data: any[];
    students_data: any[];
    time_slots: string[];
  };
  message: string;
}

// 获取排课配置信息
export const getScheduleSettings = async (
  campusId: number
): Promise<ApiResponse<ScheduleSettings>> => {
  try {
    const { data } = await request(`/api/groups/get_schedule_settings`, {
      method: 'GET',
    });

    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('获取排课配置失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取排课配置失败' };
  }
};

// 更新排课配置信息
export const updateScheduleSettings = async (
  campusId: number,
  settings: ScheduleSettings
): Promise<ApiResponse> => {
  try {
    const { data } = await request('/api/groups/update_schedule_settings', {
      method: 'POST',
      body: { campus_id: campusId, ...settings },
    });

    return normalizeApiResponse(data as ApiEnvelope);
  } catch (error) {
    console.error('更新排课配置失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '更新排课配置失败' };
  }
};

// 获取排课group列表
export const getGroupList = async (
  campusId?: number
): Promise<ApiResponse<GroupListResponse>> => {
  try {
    const params = new URLSearchParams();
    if (campusId) params.append('campus_id', String(campusId));

    const queryString = params.toString();
    const url = `/api/groups/list${queryString ? `?${queryString}` : ''}`;

    const { data } = await request(url, {
      method: 'GET',
    });

    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('获取group列表失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取group列表失败' };
  }
};

// 新增单个group
export const addSingleGroup = async (
  groupData: Group
): Promise<ApiResponse> => {
  try {
    const { data } = await request('/api/groups/add_single_group', {
      method: 'POST',
      body: groupData,
    });

    return normalizeApiResponse(data as ApiEnvelope);
  } catch (error) {
    console.error('新增group失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '新增group失败' };
  }
};

// 批量新增group
export const addBatchGroup = async (
  campusId: number,
  groups: Group[]
): Promise<ApiResponse> => {
  try {
    const { data } = await request(`/api/groups/add_batch_group/${campusId}`, {
      method: 'POST',
      body: { groups },
    });

    return normalizeApiResponse(data as ApiEnvelope);
  } catch (error) {
    console.error('批量新增group失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '批量新增group失败' };
  }
};

// 删除排课group
export const deleteGroups = async (
  recordIds?: string,
  deleteAll?: boolean
): Promise<ApiResponse> => {
  try {
    const body: any = {};
    if (deleteAll) {
      body.delete_all = 1;
    } else if (recordIds) {
      body.record_ids = recordIds;
    }

    const { data } = await request('/api/groups/delete', {
      method: 'POST',
      body,
    });

    return normalizeApiResponse(data as ApiEnvelope);
  } catch (error) {
    console.error('删除group失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '删除group失败' };
  }
};

// 编辑排课group
export const editGroup = async (
  groupData: Group
): Promise<ApiResponse> => {
  try {
    const { data } = await request('/api/groups/edit', {
      method: 'POST',
      body: groupData,
    });

    return normalizeApiResponse(data as ApiEnvelope);
  } catch (error) {
    console.error('编辑group失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '编辑group失败' };
  }
};

// 获取busy信息
export const getBusyInfo = async (
  campusId: number
): Promise<ApiResponse<BusyInfoResponse>> => {
  try {
    const { data } = await request(`/api/groups/get_busy/${campusId}`, {
      method: 'GET',
    });

    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('获取busy信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取busy信息失败' };
  }
};

// 添加busy信息请求参数
export interface AddBusyRequest {
  teacher_id?: number | string;
  student_id?: number | string;
  campus_id: number;
  busy_ids: string; // 逗号分隔的time_id，如"1,2,3"
}

// 添加busy信息
export const addBusy = async (
  busyData: AddBusyRequest
): Promise<ApiResponse> => {
  try {
    const { data } = await request('/api/groups/add_busy', {
      method: 'POST',
      body: busyData,
    });

    return normalizeApiResponse(data as ApiEnvelope);
  } catch (error) {
    console.error('添加busy信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '添加busy信息失败' };
  }
};

// 删除busy信息
export const deleteBusy = async (
  recordIds: string, // 逗号分隔的ID
  type: number // 0=student, 1=teacher
): Promise<ApiResponse> => {
  try {
    const { data } = await request('/api/groups/delete_busy', {
      method: 'POST',
      body: { record_ids: recordIds, type: String(type) },
    });

    return normalizeApiResponse(data as ApiEnvelope);
  } catch (error) {
    console.error('删除busy信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '删除busy信息失败' };
  }
};

// 开始排课（需要core_user权限）
export const startSmartSchedule = async (
  campusId: number
): Promise<ApiResponse<ScheduleResult>> => {
  try {
    const { data } = await request(`/api/groups/start_smart_schedule/${campusId}`, {
      method: 'POST',
    });

    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('开始排课失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '开始排课失败' };
  }
};

// 提交排课结果（需要core_user权限）
export const commitSchedule = async (
  campusId: number
): Promise<ApiResponse> => {
  try {
    const { data } = await request(`/api/groups/commit_schedule/${campusId}`, {
      method: 'POST',
    });

    return normalizeApiResponse(data as ApiEnvelope);
  } catch (error) {
    console.error('提交排课结果失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '提交排课结果失败' };
  }
};

// 获取所有Exam列表
export const getAllExams = async (): Promise<ApiResponse<Array<{ id: number; name: string; [key: string]: any }>>> => {
  try {
    const { data } = await request('/api/exam/get_all_exam', {
      method: 'GET',
    });

    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('获取Exam列表失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取Exam列表失败' };
  }
};

// 获取教室列表
export const getRoomList = async (): Promise<ApiResponse<{ room_list: Array<{ id: number; name: string; campus_id: number; [key: string]: any }> }>> => {
  try {
    const { data } = await request('/api/room/list/', {
      method: 'GET',
    });

    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('获取教室列表失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取教室列表失败' };
  }
};
