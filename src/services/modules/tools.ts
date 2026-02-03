import { request, normalizeApiResponse } from '../apiClient';
import type { ApiResponse, ApiEnvelope } from '../types';
import type { RemarkConfRecord, RemarkConfListResponse, RemarkConfAddParams } from './remark';
export type { RemarkConfRecord, RemarkConfListResponse, RemarkConfAddParams };

// 空闲搜索相关类型定义
export interface FreeSearchRecord {
  user_type: string;
  user_name: string;
}

export interface FreeSearchResponse {
  rows: FreeSearchRecord[];
  total: number;
}

export interface FreeSearchRequest {
  user_type: number; // 0: 教师, 1: 学生
  query_start: string; // 开始时间
  query_end: string; // 结束时间
}

// 删除lesson参数
export interface LessonDeleteParams {
  campus_id: number;
  start_day: string; // YYYY-MM-DD
  end_day: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
}

// 调整房间参数
export interface LessonRoomChangeParams {
  campus_id: number;
  start_day: string; // YYYY-MM-DD
  end_day: string; // YYYY-MM-DD
  max_num: number;
}

// 调整重复房间参数
export interface LessonDoubleRoomChangeParams {
  max_num: number;
  order: number; // 0: 逆序, 1: 正序
}

// 调整课程日期参数
export interface LessonDayChangeParams {
  campus_id: number;
  start_day: string; // YYYY-MM-DD
  end_day: string; // YYYY-MM-DD
}

// 修改学生大学状态参数
export interface StudentUniversityChangeParams {
  student_id: number;
  university_status: number;
}

// 重要日期相关类型
export interface SpecialDayRecord {
  record_id: number;
  campus_id: number;
  campus_name: string;
  show_day: string;
  show_type: number;
  show_type_name: string;
  desc: string;
}

export interface SpecialDayListResponse {
  rows: SpecialDayRecord[];
  total: number;
}

export interface SpecialDayAddParams {
  campus_ids: string; // 逗号分隔的校区ID
  show_types: string; // 逗号分隔的显示类型
  show_date: string; // YYYY-MM-DD
  desc: string;
}

// 双倍课时费class类型
export interface DoubleClassRecord {
  record_id: number;
  campus_id: number;
  campus_name: string;
  class_name: string;
}

export interface DoubleClassListResponse {
  rows: DoubleClassRecord[];
  total: number;
}

// Remark配置相关类型 - 已移至 modules/remark.ts

// 权限复制参数
export interface CopyRightParams {
  from_staff_id: number;
  to_staff_id: number;
}

// Exam report时间相关类型
export interface ReportTimeRecord {
  record_id: number;
  campus_id: number;
  campus_name: string;
  start_day: string;
  operator_id: number;
  operator_name: string;
}

export interface ReportTimeListResponse {
  rows: ReportTimeRecord[];
  total: number;
}

export interface ReportTimeAddParams {
  campus_id: number;
  start_day: string; // YYYY-MM-DD
}

// 开学时间相关类型
export interface StartTimeRecord {
  record_id: number;
  campus_id: number;
  campus_name: string;
  start_day: string;
  operator_id: number;
  operator_name: string;
}

export interface StartTimeListResponse {
  rows: StartTimeRecord[];
  total: number;
}

export interface StartTimeAddParams {
  campus_id: number;
  start_day: string; // YYYY-MM-DD
}

// 休复学(suspension)相关类型
export interface LeaveSchoolRecord {
  record_id?: number;
  id?: number;
  student_id?: number;
  student_name?: string;
  // 新版字段（后端必填）
  leave_start_date?: string; // YYYY-MM-DD
  leave_end_date?: string; // YYYY-MM-DD
  leave_reason?: string;
  remark?: string;
  // 复学相关字段
  is_reopened?: boolean | number; // 是否已复学
  actual_reopen_date?: string; // 实际复学时间 YYYY-MM-DD
  reapply_date?: string; // 复学时间 YYYY-MM-DD
  // 兼容旧字段
  start_day?: string;
  end_day?: string;
  desc?: string;
  [key: string]: any;
}

export interface LeaveSchoolListResponse {
  rows: LeaveSchoolRecord[];
  total: number;
}

export interface LeaveSchoolAddParams {
  student_id: number;
  // 后端必填字段（mentor_id 后端自动获取）
  leave_start_date: string; // YYYY-MM-DD
  leave_end_date: string; // YYYY-MM-DD
  leave_reason: string;
  remark: string;
  // 复学相关字段（可选）
  is_reopened?: boolean | number; // 是否已复学
  actual_reopen_date?: string; // 实际复学时间 YYYY-MM-DD
  reapply_date?: string; // 复学时间 YYYY-MM-DD
  [key: string]: any;
}

export interface LeaveSchoolEditParams {
  record_id: number;
  // 编辑时不需要 student_id
  leave_start_date: string; // YYYY-MM-DD
  leave_end_date: string; // YYYY-MM-DD
  leave_reason: string;
  remark: string;
  // 复学相关字段（可选）
  is_reopened?: boolean | number; // 是否已复学
  actual_reopen_date?: string; // 实际复学时间 YYYY-MM-DD
  reapply_date?: string; // 复学时间 YYYY-MM-DD
  [key: string]: any;
}

// 删除参数
export interface DeleteParams {
  record_id: number;
}

// 查询空闲时间
export const freeSearch = async (params: FreeSearchRequest): Promise<ApiResponse<FreeSearchResponse>> => {
  try {
    const startDate = new Date(params.query_start);
    const endDate = new Date(params.query_end);
    
    const { data } = await request('/api/tools/free_search', {
      method: 'POST',
      body: {
        user_type: params.user_type,
        query_start: startDate,
        query_end: endDate,
      },
    });
    return normalizeApiResponse(data as ApiEnvelope<FreeSearchResponse>);
  } catch (error) {
    console.error('查询空闲时间失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '查询空闲时间失败' };
  }
};

// 删除lesson
export const lessonDelete = async (params: LessonDeleteParams): Promise<ApiResponse<string>> => {
  try {
    const { data } = await request('/api/tools/lesson_delete', {
      method: 'POST',
      body: {
        campus_id: params.campus_id,
        start_day: params.start_day,
        end_day: params.end_day,
        start_time: params.start_time,
        end_time: params.end_time,
      },
    });
    return normalizeApiResponse(data as ApiEnvelope<string>);
  } catch (error) {
    console.error('删除lesson失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '删除lesson失败' };
  }
};

// 按日期调整房间
export const lessonRoomChange = async (params: LessonRoomChangeParams): Promise<ApiResponse<string>> => {
  try {
    const { data } = await request('/api/tools/lesson_room_change', {
      method: 'POST',
      body: {
        campus_id: params.campus_id,
        start_day: params.start_day,
        end_day: params.end_day,
        max_num: params.max_num,
      },
    });
    return normalizeApiResponse(data as ApiEnvelope<string>);
  } catch (error) {
    console.error('调整房间失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '调整房间失败' };
  }
};

// 调整重复房间
export const lessonDoubleRoomChange = async (params: LessonDoubleRoomChangeParams): Promise<ApiResponse<string | number>> => {
  try {
    const { data } = await request('/api/tools/lesson_double_room_change', {
      method: 'POST',
      body: {
        max_num: params.max_num,
        order: params.order,
      },
    });
    return normalizeApiResponse(data as ApiEnvelope<string | number>);
  } catch (error) {
    console.error('调整重复房间失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '调整重复房间失败' };
  }
};

// 调整课程日期
export const lessonDayChange = async (params: LessonDayChangeParams): Promise<ApiResponse<string>> => {
  try {
    const { data } = await request('/api/tools/lesson_day_change', {
      method: 'POST',
      body: {
        campus_id: params.campus_id,
        start_day: params.start_day,
        end_day: params.end_day,
      },
    });
    return normalizeApiResponse(data as ApiEnvelope<string>);
  } catch (error) {
    console.error('调整课程日期失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '调整课程日期失败' };
  }
};

// 修改学生大学确认状态
export const studentUniversityChange = async (params: StudentUniversityChangeParams): Promise<ApiResponse<string>> => {
  try {
    const { data } = await request('/api/tools/student_university_change', {
      method: 'POST',
      body: {
        student_id: params.student_id,
        university_status: params.university_status,
      },
    });
    return normalizeApiResponse(data as ApiEnvelope<string>);
  } catch (error) {
    console.error('修改学生大学状态失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '修改学生大学状态失败' };
  }
};

// 新增重要日期
export const specialDayAdd = async (params: SpecialDayAddParams): Promise<ApiResponse<string>> => {
  try {
    const { data } = await request('/api/tools/special_day_add', {
      method: 'POST',
      body: {
        campus_ids: params.campus_ids,
        show_types: params.show_types,
        show_date: params.show_date,
        desc: params.desc,
      },
    });
    return normalizeApiResponse(data as ApiEnvelope<string>);
  } catch (error) {
    console.error('新增重要日期失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '新增重要日期失败' };
  }
};

// 删除重要日期
export const specialDayDelete = async (params: DeleteParams): Promise<ApiResponse<string>> => {
  try {
    const { data } = await request('/api/tools/special_day_delete', {
      method: 'POST',
      body: {
        record_id: params.record_id,
      },
    });
    return normalizeApiResponse(data as ApiEnvelope<string>);
  } catch (error) {
    console.error('删除重要日期失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '删除重要日期失败' };
  }
};

// 获取重要日期列表
export const getSpecialDay = async (): Promise<ApiResponse<SpecialDayListResponse>> => {
  try {
    const { data } = await request('/api/tools/get_special_day', {
      method: 'GET',
    });
    return normalizeApiResponse(data as ApiEnvelope<SpecialDayListResponse>);
  } catch (error) {
    console.error('获取重要日期列表失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取重要日期列表失败', data: { rows: [], total: 0 } };
  }
};

// 清除缓存
export const cleanCache = async (): Promise<ApiResponse<string>> => {
  try {
    const { data } = await request('/api/tools/clean_cache', {
      method: 'GET',
    });
    return normalizeApiResponse(data as ApiEnvelope<string>);
  } catch (error) {
    console.error('清除缓存失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '清除缓存失败' };
  }
};

// 获取双倍课时费class列表
export const getDoubleClass = async (): Promise<ApiResponse<DoubleClassListResponse>> => {
  try {
    const { data } = await request('/api/tools/get_double_class', {
      method: 'GET',
    });
    return normalizeApiResponse(data as ApiEnvelope<DoubleClassListResponse>);
  } catch (error) {
    console.error('获取双倍课时费class列表失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取双倍课时费class列表失败', data: { rows: [], total: 0 } };
  }
};

// 新增remark费用配置
export const remarkConfAdd = async (params: RemarkConfAddParams): Promise<ApiResponse<string>> => {
  try {
    const { data } = await request('/api/tools/remark_conf_add', {
      method: 'POST',
      body: {
        exam_center: params.exam_center,
        conf_type: params.conf_type,
        price: params.price,
      },
    });
    return normalizeApiResponse(data as ApiEnvelope<string>);
  } catch (error) {
    console.error('新增remark费用配置失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '新增remark费用配置失败' };
  }
};

// 获取remark配置列表
export const getRemarkConf = async (): Promise<ApiResponse<RemarkConfListResponse>> => {
  try {
    const { data } = await request('/api/tools/get_remark_conf', {
      method: 'GET',
    });
    return normalizeApiResponse(data as ApiEnvelope<RemarkConfListResponse>);
  } catch (error) {
    console.error('获取remark配置列表失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取remark配置列表失败', data: { rows: [], total: 0 } };
  }
};

// 权限复制
export const copyRight = async (params: CopyRightParams): Promise<ApiResponse<string>> => {
  try {
    const { data } = await request('/api/tools/copy_right', {
      method: 'POST',
      body: {
        from_staff_id: params.from_staff_id,
        to_staff_id: params.to_staff_id,
      },
    });
    return normalizeApiResponse(data as ApiEnvelope<string>);
  } catch (error) {
    console.error('权限复制失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '权限复制失败' };
  }
};

// 新增exam report开放时间
export const addReportTime = async (params: ReportTimeAddParams): Promise<ApiResponse<string>> => {
  try {
    const { data } = await request('/api/tools/add_report_time', {
      method: 'POST',
      body: {
        campus_id: params.campus_id,
        start_day: params.start_day,
      },
    });
    return normalizeApiResponse(data as ApiEnvelope<string>);
  } catch (error) {
    console.error('新增exam report开放时间失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '新增exam report开放时间失败' };
  }
};

// 删除exam report开放时间
export const deleteReportTime = async (params: DeleteParams): Promise<ApiResponse<string>> => {
  try {
    const { data } = await request('/api/tools/delete_report_time', {
      method: 'POST',
      body: {
        record_id: params.record_id,
      },
    });
    return normalizeApiResponse(data as ApiEnvelope<string>);
  } catch (error) {
    console.error('删除exam report开放时间失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '删除exam report开放时间失败' };
  }
};

// 获取exam report开放时间列表
export const getReportTime = async (): Promise<ApiResponse<ReportTimeListResponse>> => {
  try {
    const { data } = await request('/api/tools/get_report_time', {
      method: 'GET',
    });
    return normalizeApiResponse(data as ApiEnvelope<ReportTimeListResponse>);
  } catch (error) {
    console.error('获取exam report开放时间列表失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取exam report开放时间列表失败', data: { rows: [], total: 0 } };
  }
};

// 新增开学时间
export const addStartTime = async (params: StartTimeAddParams): Promise<ApiResponse<string>> => {
  try {
    const { data } = await request('/api/tools/add_start_time', {
      method: 'POST',
      body: {
        campus_id: params.campus_id,
        start_day: params.start_day,
      },
    });
    return normalizeApiResponse(data as ApiEnvelope<string>);
  } catch (error) {
    console.error('新增开学时间失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '新增开学时间失败' };
  }
};

// 删除开学时间
export const deleteStartTime = async (params: DeleteParams): Promise<ApiResponse<string>> => {
  try {
    const { data } = await request('/api/tools/delete_start_time_conf', {
      method: 'POST',
      body: {
        record_id: params.record_id,
      },
    });
    return normalizeApiResponse(data as ApiEnvelope<string>);
  } catch (error) {
    console.error('删除开学时间失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '删除开学时间失败' };
  }
};

// 获取开学时间列表
export const getStartTime = async (): Promise<ApiResponse<StartTimeListResponse>> => {
  try {
    const { data } = await request('/api/tools/get_start_time', {
      method: 'GET',
    });
    return normalizeApiResponse(data as ApiEnvelope<StartTimeListResponse>);
  } catch (error) {
    console.error('获取开学时间列表失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取开学时间列表失败', data: { rows: [], total: 0 } };
  }
};

// 新增休复学记录
export const addLeaveSchool = async (params: LeaveSchoolAddParams): Promise<ApiResponse<string>> => {
  try {
    const { data } = await request('/api/tools/add_leave_school', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data as ApiEnvelope<string>);
  } catch (error) {
    console.error('新增休复学记录失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '新增休复学记录失败' };
  }
};

// 编辑休复学记录
export const editLeaveSchool = async (params: LeaveSchoolEditParams): Promise<ApiResponse<string>> => {
  try {
    const { data } = await request('/api/tools/edit_leave_school', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data as ApiEnvelope<string>);
  } catch (error) {
    console.error('编辑休复学记录失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '编辑休复学记录失败' };
  }
};

// 获取休复学记录列表
export const getLeaveSchool = async (): Promise<ApiResponse<LeaveSchoolListResponse>> => {
  try {
    const { data } = await request('/api/tools/get_leave_school', {
      method: 'GET',
    });
    return normalizeApiResponse(data as ApiEnvelope<LeaveSchoolListResponse>);
  } catch (error) {
    console.error('获取休复学记录失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取休复学记录失败', data: { rows: [], total: 0 } };
  }
};

// 删除休复学记录
export const deleteLeaveSchool = async (params: DeleteParams): Promise<ApiResponse<string>> => {
  try {
    const { data } = await request('/api/tools/delete_leave_school', {
      method: 'POST',
      body: {
        record_id: params.record_id,
      },
    });
    return normalizeApiResponse(data as ApiEnvelope<string>);
  } catch (error) {
    console.error('删除休复学记录失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '删除休复学记录失败' };
  }
};

// 上传选课说明文件
export const uploadCooksbookFile = async (campusId: number, file: File): Promise<ApiResponse<string>> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await request(`/api/tools/upload_cooksbook_file/${campusId}`, {
      method: 'POST',
      body: formData,
      auth: true,
    });
    return normalizeApiResponse(data as ApiEnvelope<string>);
  } catch (error) {
    console.error('上传选课说明文件失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '上传选课说明文件失败' };
  }
};

// ============= 网站配置 API =============

export interface SiteConfig {
  sales_simplified_mode: boolean; // sales 简化模式：发送合同时只发送服务协议、list 中只显示一个按钮、预览时只显示一个 iframe
}

// 获取网站配置
export const getSiteConfig = async (): Promise<ApiResponse<SiteConfig>> => {
  try {
    const { data } = await request<ApiEnvelope<SiteConfig>>('/api/site/api-site-config', {
      method: 'GET',
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取网站配置失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取网站配置失败',
      data: {
        sales_simplified_mode: false,
      },
    };
  }
};

// 更新网站配置
export const updateSiteConfig = async (config: SiteConfig): Promise<ApiResponse<string>> => {
  try {
    const { data } = await request<ApiEnvelope<string>>('/api/site/api-site-config', {
      method: 'POST',
      body: {
        site_conf: config,
      },
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('更新网站配置失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '更新网站配置失败',
    };
  }
};
