import { request, normalizeApiResponse } from '../apiClient';
import type { ApiResponse, ApiEnvelope } from '../types';

// 警告类型定义
export interface WarningRecord {
  record_id: number;
  student_id: number;
  student_name: string;
  campus_id: number;
  campus_name: string;
  warn_type: number;
  warn_select: string;
  warn_select_str: string;
  warn_type_str: string;
  warn_reason: string;
  warn_time: string;
  operator: string;
  operator_name: string;
  create_time: string;
  update_time: string;
  can_edit: number;
}

export interface WarningListResponse {
  rows: WarningRecord[];
  total: number;
}

export interface StudentOption {
  id: number;
  name: string;
}

export interface WarningSelectResponse {
  student_list: StudentOption[];
  oral_warn_select: Record<string, string>;
  write_warn_select: Record<string, string>;
}

export interface AddWarningRequest {
  student_id: number;
  warn_type: number;
  warn_select: string;
  warn_reason: string;
  warn_time: string;
}

export interface EditWarningRequest {
  record_id: number;
  warn_type: number;
  warn_select: string;
  warn_reason: string;
  warn_time: string;
}

// 获取警告列表
export const getWarningList = async (): Promise<ApiResponse<WarningListResponse>> => {
  try {
    const { data } = await request('/api/warning/get_warning_list', {
      method: 'GET',
    });
    return normalizeApiResponse(data as ApiEnvelope<WarningListResponse>);
  } catch (error) {
    console.error('获取警告列表失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取警告列表失败' };
  }
};

// 获取警告选项
export const getWarningSelect = async (): Promise<ApiResponse<WarningSelectResponse>> => {
  try {
    const { data } = await request('/api/warning/get_warning_select', {
      method: 'GET',
    });
    return normalizeApiResponse(data as ApiEnvelope<WarningSelectResponse>);
  } catch (error) {
    console.error('获取警告选项失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取警告选项失败' };
  }
};

// 新增警告
export const addWarning = async (params: AddWarningRequest): Promise<ApiResponse> => {
  try {
    const { data } = await request('/api/warning/add_warning', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data as ApiEnvelope);
  } catch (error) {
    console.error('新增警告失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '新增警告失败' };
  }
};

// 编辑警告
export const editWarning = async (params: EditWarningRequest): Promise<ApiResponse> => {
  try {
    const { data } = await request('/api/warning/edit_warning', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data as ApiEnvelope);
  } catch (error) {
    console.error('编辑警告失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '编辑警告失败' };
  }
};

// 删除警告
export const deleteWarning = async (recordId: number): Promise<ApiResponse> => {
  try {
    const { data } = await request('/api/warning/del_warning', {
      method: 'POST',
      body: { record_id: recordId },
    });
    return normalizeApiResponse(data as ApiEnvelope);
  } catch (error) {
    console.error('删除警告失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '删除警告失败' };
  }
};
