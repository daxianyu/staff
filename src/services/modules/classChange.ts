import { request, normalizeApiResponse } from '../apiClient';
import type { ApiResponse } from '../types';

// 调课申请相关类型定义
export interface ClassChangeSelectData {
  students: Record<string, string>;
  op_dict: Record<string, string>;
  staff_info: Record<string, string>;
  status_dict: Record<string, string>;
}

export interface ClassChangeSelectResponse {
  code: number;
  message: string;
  data: ClassChangeSelectData;
}

export interface MentorClassChangeRecord {
  id: number;
  apply_id: number;
  apply_name: string;
  operator_id: number;
  operator_name: string;
  student_name: string;
  apply_desc: string;
  apply_time: number;
  status: number;
  reject_reason: string;
}

export interface ClassChangeListResponse {
  code: number;
  message: string;
  data: MentorClassChangeRecord[];
}

export interface AddClassChangeParams {
  teacher_id: number;
  teacher_name: string;
  student_id: number;
  student_name: string;
  change_desc: string;
}

export interface MentorUpdateClassChangeStatusParams {
  record_id: number;
  status: number;
  reject_reason?: string;
}

/**
 * 获取调课申请选择数据
 * @returns 选择数据
 */
export const getClassChangeSelect = async (): Promise<ClassChangeSelectResponse> => {
  try {
    const { data } = await request('/api/classroom/get_class_change_select', {
      method: 'GET',
    });
    const response = normalizeApiResponse(data as any);
    return {
      code: response.code,
      message: response.message,
      data: (response.data as ClassChangeSelectData) || {
        students: {},
        op_dict: {},
        staff_info: {},
        status_dict: {}
      }
    };
  } catch (error) {
    console.error('获取调课申请选择数据失败:', error);
    return { 
      code: 500, 
      message: error instanceof Error ? error.message : '获取调课申请选择数据失败',
      data: {
        students: {},
        op_dict: {},
        staff_info: {},
        status_dict: {}
      }
    };
  }
};

/**
 * 获取调课申请列表
 * @returns 调课申请列表
 */
export const getClassChangeList = async (): Promise<ClassChangeListResponse> => {
  try {
    const { data } = await request('/api/core/operator_list', {
      method: 'GET',
    });
    const response = normalizeApiResponse(data as any);
    return {
      code: response.code,
      message: response.message,
      data: (response.data as MentorClassChangeRecord[]) || []
    };
  } catch (error) {
    console.error('获取调课申请列表失败:', error);
    return { 
      code: 500, 
      message: error instanceof Error ? error.message : '获取调课申请列表失败',
      data: []
    };
  }
};

/**
 * 添加调课申请
 * @param params 申请参数
 * @returns 添加结果
 */
export const addClassChange = async (params: AddClassChangeParams): Promise<ApiResponse> => {
  try {
    const { data } = await request('/api/classroom/class_change/add', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('添加调课申请失败:', error);
    return { 
      code: 500, 
      message: error instanceof Error ? error.message : '添加调课申请失败'
    };
  }
};

/**
 * 更新调课申请状态
 * @param params 更新参数
 * @returns 更新结果
 */
export const updateMentorClassChangeStatus = async (params: MentorUpdateClassChangeStatusParams): Promise<ApiResponse> => {
  try {
    const { data } = await request('/api/classroom/class_change/update_status', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('更新调课申请状态失败:', error);
    return { 
      code: 500, 
      message: error instanceof Error ? error.message : '更新调课申请状态失败'
    };
  }
};
